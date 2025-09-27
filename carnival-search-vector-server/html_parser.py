import re
from copy import copy
from dataclasses import dataclass
from typing import IO

import bs4
import trafilatura
from trafilatura.settings import use_config


@dataclass
class ParsedHTML:
    title: str | None
    cleaned_text: str


def strip_excessive_newlines_and_spaces(document: str) -> str:
    document = re.sub(r" +", " ", document)
    document = re.sub(r" +[\n\r]", "\n", document)
    document = re.sub(r"[\n\r]+", "\n", document)
    return document.strip()


def strip_newlines(document: str) -> str:
    return re.sub(r"[\n\r]+", " ", document)


def format_element_text(element_text: str, link_href: str | None) -> str:
    element_text_no_newlines = strip_newlines(element_text)

    if not link_href:
        return element_text_no_newlines

    return f"[{element_text_no_newlines}]({link_href})"


def parse_html_with_trafilatura(html_content: str) -> str:
    """Parse HTML content using trafilatura."""
    config = use_config()
    config.set("DEFAULT", "include_links", "True")
    config.set("DEFAULT", "include_tables", "True")
    config.set("DEFAULT", "include_formatting", "True")

    extracted_text = trafilatura.extract(html_content, config=config)
    return strip_excessive_newlines_and_spaces(extracted_text) if extracted_text else ""


def format_document_soup(
    document: bs4.BeautifulSoup, table_cell_separator: str = "\t"
) -> str:
    """Format html to a flat text document.

    The following goals:
    - Newlines from within the HTML are removed (as browser would ignore them as well).
    - Repeated newlines/spaces are removed (as browsers would ignore them).
    - Newlines only before and after headlines and paragraphs or when explicit (br or pre tag)
    - Table columns/rows are separated by newline
    - List elements are separated by newline and start with a hyphen
    """
    text = ""
    list_element_start = False
    verbatim_output = 0
    in_table = False
    last_added_newline = False
    link_href: str | None = None

    for e in document.descendants:
        verbatim_output -= 1
        if isinstance(e, bs4.element.NavigableString):
            if isinstance(e, (bs4.element.Comment, bs4.element.Doctype)):
                continue
            element_text = e.text
            if in_table:
                element_text = element_text.replace("\n", " ").strip()

            if last_added_newline and element_text.startswith(" "):
                element_text = element_text[1:]
                last_added_newline = False

            if element_text:
                content_to_add = (
                    element_text
                    if verbatim_output > 0
                    else format_element_text(element_text, link_href)
                )

                if (text and not text[-1].isspace()) and (
                    content_to_add and not content_to_add[0].isspace()
                ):
                    text += " "

                text += content_to_add

                list_element_start = False
        elif isinstance(e, bs4.element.Tag):
            if e.name == "table":
                in_table = True
            elif e.name == "tr" and in_table:
                text += "\n"
            elif e.name in ["td", "th"] and in_table:
                text += table_cell_separator
            elif e.name == "/table":
                in_table = False
            elif in_table:
                pass
            elif e.name == "a":
                href_value = e.get("href", None)
                link_href = (
                    href_value[0] if isinstance(href_value, list) else href_value
                )
            elif e.name == "/a":
                link_href = None
            elif e.name in ["p", "div"]:
                if not list_element_start:
                    text += "\n"
            elif e.name in ["h1", "h2", "h3", "h4"]:
                text += "\n"
                list_element_start = False
                last_added_newline = True
            elif e.name == "br":
                text += "\n"
                list_element_start = False
                last_added_newline = True
            elif e.name == "li":
                text += "\n- "
                list_element_start = True
            elif e.name == "pre":
                if verbatim_output <= 0:
                    verbatim_output = len(list(e.childGenerator()))
    return strip_excessive_newlines_and_spaces(text)


def parse_html_page_basic(text: str | IO[bytes]) -> str:
    soup = bs4.BeautifulSoup(text, "html.parser")
    return format_document_soup(soup)


def _remove_macro_stylings(soup: bs4.BeautifulSoup) -> None:
    """Remove Confluence macro stylings and parameters from the soup."""
    for macro_root in soup.findAll("ac:structured-macro"):
        if not isinstance(macro_root, bs4.Tag):
            continue

        macro_styling = macro_root.find(name="ac:parameter", attrs={"ac:name": "page"})
        if not macro_styling or not isinstance(macro_styling, bs4.Tag):
            continue

        macro_styling.extract()



def _clean_url_encoded_content(soup: bs4.BeautifulSoup) -> None:
    """Remove or clean up URL-encoded content that might contain macro data."""
    import urllib.parse
    
    for text_node in soup.find_all(text=True):
        if isinstance(text_node, bs4.element.NavigableString):
            text = text_node.string
            if text and '%' in text and len(text) > 50:
                try:
                    decoded = urllib.parse.unquote(text)
                    if decoded.startswith('{"') and decoded.endswith('}'):
                        text_node.extract()
                    elif '%7B%22' in text or '%22%3A%22' in text:
                        text_node.extract()
                except Exception:
                    pass


def extract_text_from_confluence_html(object_html: str) -> str:
    """Parse a Confluence html page and format it for better readability.

    Args:
        confluence_object (dict): The confluence object as a dict
    Returns:
        str: loaded and formatted Confluence page
    """
    if not object_html:
        return ""

    soup = bs4.BeautifulSoup(object_html, "html.parser")

    _remove_macro_stylings(soup=soup)
    
    _clean_url_encoded_content(soup)

    return format_document_soup(soup)


def web_html_cleanup(
    page_content: str | bs4.BeautifulSoup,
    mintlify_cleanup_enabled: bool = True,
    additional_element_types_to_discard: list[str] | None = None,
) -> ParsedHTML:
    """Clean up HTML content and extract readable text."""
    if isinstance(page_content, str):
        soup = bs4.BeautifulSoup(page_content, "html.parser")
    else:
        soup = page_content

    title_tag = soup.find("title")
    title = None
    if title_tag and title_tag.text:
        title = title_tag.text
        title_tag.extract()

    unwanted_classes = ["sticky", "hidden", "nav", "sidebar", "footer", "header"]
    if mintlify_cleanup_enabled:
        unwanted_classes.extend(["sticky", "hidden"])
    for undesired_element in unwanted_classes:
        [
            tag.extract()
            for tag in soup.find_all(
                class_=lambda x: x and undesired_element in x.split()
            )
        ]

    unwanted_elements = ["script", "style", "nav", "footer", "header"]
    for undesired_tag in unwanted_elements:
        [tag.extract() for tag in soup.find_all(undesired_tag)]

    if additional_element_types_to_discard:
        for undesired_tag in additional_element_types_to_discard:
            [tag.extract() for tag in soup.find_all(undesired_tag)]

    soup_string = str(soup)
    page_text = ""

    try:
        page_text = parse_html_with_trafilatura(soup_string)
        if not page_text:
            raise ValueError("Empty content returned by trafilatura.")
    except Exception as e:
        print(f"Trafilatura parsing failed: {e}. Falling back on bs4.")
        page_text = format_document_soup(soup)

    cleaned_text = page_text.replace("\u200b", "")

    return ParsedHTML(title=title, cleaned_text=cleaned_text) 