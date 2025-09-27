import string
from typing import List
from type_classes import Document

def remove_stop_words_and_punctuation(query_terms: List[str]) -> List[str]:
    stop_words = {
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", 
        "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 
        'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 
        'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 
        'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 
        'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 
        'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 
        'while', 'of', 'at', 'by', 'for', 'with', 'through', 'during', 'before', 'after', 
        'above', 'below', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 
        'further', 'then', 'once'
    }
    
    processed_terms = []
    for term in query_terms:
        cleaned_term = term.translate(str.maketrans('', '', string.punctuation)).lower().strip()
        
        if cleaned_term and len(cleaned_term) > 1 and cleaned_term not in stop_words:
            processed_terms.append(cleaned_term)
    
    return processed_terms

def build_system_message(include_citations: bool = True) -> str:
    """
    Build system message for the LLM
    Based on onyx/chat/prompt_builder/answer_prompt_builder.py
    """
    base_system = """You are a helpful AI assistant that answers questions based on the provided context documents.

Instructions:
- Use only the information provided in the context documents to answer questions
- Be concise and accurate in your responses
- If the context doesn't contain enough information to fully answer the question, say so
- Maintain a helpful and professional tone"""

    if include_citations:
        citation_instructions = """
- ALWAYS cite your sources by referencing the document using [Doc X] format where X is the document number
- Include citations for all factual claims and specific information"""
        base_system += citation_instructions

    return base_system

def build_user_message(query: str, documents: List) -> str:
    context_section = "CONTEXT DOCUMENTS:\n\n"
    
    if documents:
        for i, doc in enumerate(documents, 1):
            context_section += f"[Doc {i}]: {str(doc)}\n\n"
    else:
        context_section += "No relevant documents found.\n\n"
    
    user_message = f"""{context_section}

QUERY: {query}

Please provide a comprehensive answer based on the context documents above."""

    return user_message


def formatted_doc(doc: Document) -> Document:
    return Document(
        id=doc.id,
        title=doc.title.replace('\u0000', '').replace('||', ' '),
        content=doc.content.replace('\u0000', '').replace('||', ' ') if doc.content is not None else None,
        url=doc.url,
        metadata=doc.metadata,
        app_type=doc.app_type
    )