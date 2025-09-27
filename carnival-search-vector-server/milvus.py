from pymilvus import (
    DataType,
    MilvusClient,
    Function,
    FunctionType,
    AnnSearchRequest,
    RRFRanker,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import List
import requests
from bs4 import BeautifulSoup
import concurrent.futures
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv(override=True)

openai_client = OpenAI()


def create_embeddings(text):
    return (
        openai_client.embeddings.create(input=text, model="text-embedding-3-small")
        .data[0]
        .embedding
    )

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2600,
    chunk_overlap=325
)

client = MilvusClient(
    uri=os.getenv("MILVUS_URI"), token=os.getenv("MILVUS_TOKEN"), db_name="default"
)

schema = MilvusClient.create_schema(
    auto_id=False,
    enable_dynamic_field=True,
)

schema.add_field(
    field_name="id", datatype=DataType.INT64, is_primary=True, auto_id=True
)
schema.add_field(
    field_name="content_dense_vector", datatype=DataType.FLOAT_VECTOR, dim=1536
)
schema.add_field(
    field_name="content_sparse_vector", datatype=DataType.SPARSE_FLOAT_VECTOR
)
schema.add_field(field_name="url", datatype=DataType.VARCHAR, max_length=1000)
schema.add_field(field_name="chunk_index", datatype=DataType.INT64)
schema.add_field(
    field_name="content",
    datatype=DataType.VARCHAR,
    enable_analyzer=True,
    max_length=60000
)
schema.add_field(
    field_name="title",
    datatype=DataType.VARCHAR,
    enable_analyzer=True,
    max_length=10000
)

content_bm25_function = Function(
    name="text_bm25_emb",
    input_field_names=["content"],
    output_field_names=["content_sparse_vector"],
    function_type=FunctionType.BM25,
)
schema.add_function(content_bm25_function)

if not client.has_collection(collection_name="app_documents"):
    index_params = client.prepare_index_params()
    index_params.add_index(
        field_name="content_dense_vector",
        index_name="content_dense_index",
        index_type="IVF_FLAT",
        metric_type="IP",
        params={"nlist": 128},
    )
    index_params.add_index(
        field_name="content_sparse_vector",
        index_name="content_sparse_index",
        index_type="SPARSE_INVERTED_INDEX",
        metric_type="BM25",
        params={"inverted_index_algo": "DAAT_MAXSCORE"},
    )
    client.create_collection(
        collection_name="app_documents",
        schema=schema,
        enable_dynamic_field=True,
        index_params=index_params,
    )

def store_embeddings(
    url,
    chunk_index,
    content_chunk,
):
    content_embedding = create_embeddings(content_chunk)
    client.insert(
        collection_name="app_documents",
        data=[
            {
                "content_dense_vector": content_embedding,
                "url": url,
                "chunk_index": chunk_index,
                "content": content_chunk,
            }
        ],
    )
    client.flush(collection_name="app_documents")

def hybrid_search(query_text: str):
    query_embedding = create_embeddings(query_text)

    request_1 = AnnSearchRequest(
        data=[query_embedding],
        anns_field="content_dense_vector",
        param={
            "metric_type": "IP",
            "params": {"nprobe": 10, "radius": 0.35, "range_filter": 1.0},
        },
        limit=15,
    )
    request_2 = AnnSearchRequest(
        data=[query_text],
        anns_field="content_sparse_vector",
        param={
            "metric_type": "BM25",
        },
        limit=15,
    )

    reqs = [request_1, request_2]

    ranker = RRFRanker(15)

    results = client.hybrid_search(
        collection_name="app_documents",
        reqs=reqs,
        ranker=ranker,
        output_fields=["id","title", "content", "url", "chunk_index"],
        limit=20
    )

    return results



# def fetch_url(url: str):
#     try:
#         response = requests.get(url)
#         response.raise_for_status()

#         soup = BeautifulSoup(response.content, 'html.parser')

#         full_text = soup.get_text(' ', strip=True)
#         marker = "On this page"
#         test_across_marker = "Test across 3000+ combinations"
        
#         text_content = full_text

#         if marker in full_text:
#             first_idx = full_text.find(marker)
#             text_content = full_text[first_idx + len(marker):].strip()

#         if test_across_marker in text_content:
#             last_idx = text_content.rfind(test_across_marker)
#             text_content = text_content[:last_idx].strip()
            
#         if not text_content:
#             raise Exception("No content could be extracted from the URL.")

#         return text_content

#     except Exception as e:
#         print(f"An unexpected error occurred when fetching the url {url}: {e}")


# def fetch_sitemap_urls(sitemap_url: str) -> List[str]:
#     try:
#         response = requests.get(sitemap_url, timeout=10)
#         response.raise_for_status()
        
#         soup = BeautifulSoup(response.content, 'xml')
        
#         urls = []
#         for loc in soup.find_all('loc'):
#             if loc.text:
#                 if loc.text.strip() != "https://www.lambdatest.com/support/":
#                     urls.append(loc.text.strip())
        
#         return urls
    
#     except Exception as e:
#         print(f"Error fetching sitemap from {sitemap_url}: {e}")
#         return []
            
    
# def setup_session() -> requests.Session:
#     session = requests.Session()
#     session.headers.update({
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
#     })
    
#     retries = Retry(
#         total=5,
#         backoff_factor=1,
#         status_forcelist=[429, 500, 502, 503, 504],
#         allowed_methods={"HEAD", "GET", "OPTIONS"}
#     )
    
#     adapter = HTTPAdapter(max_retries=retries)
#     session.mount("https://", adapter)
#     session.mount("http://", adapter)
    
#     return session

# def process_url(url: str, session: requests.Session):
#     try:
#         records = client.query(
#             collection_name="app_documents",
#             filter=f"url == '{url}'",
#         )
        
#         if not records:
#             print(f"No records found in DB for URL, skipping: {url}")
#             return url, "Skipped (No Records)"

#         response = session.get(url, timeout=15)
#         response.raise_for_status()
        
#         soup = BeautifulSoup(response.content, 'html.parser')
#         page_title = soup.find("title").string if soup.find("title") else None

#         updated_records = [
#             {
#                 "id": record.get("id"),
#                 "title": page_title,
#                 "url": record.get("url"),
#                 "chunk_index": record.get("chunk_index"),
#                 "content": record.get("content"),
#                 "content_dense_vector": record.get("content_dense_vector"),
#             } for record in records
#         ]

#         if updated_records:
#             client.upsert(
#                 collection_name="app_documents",
#                 data=updated_records
#             )
        
#         return url, "Success"

#     except requests.exceptions.RequestException as e:
#         return url, f"Failed (Request Error): {e}"
#     except Exception as e:
#         return url, f"Failed (General Error): {e}"

# def fetch_all_urls_from_sitemap_parallel(sitemap_url: str, max_workers: int = 10):
#     """
#     Fetches all URLs from a sitemap and processes them in parallel using a thread pool.
#     """
#     print(f"Fetching URLs from sitemap: {sitemap_url}")
#     try:
#         urls = fetch_sitemap_urls(sitemap_url)
#         if not urls:
#             print("No URLs found in the sitemap.")
#             return
#     except Exception as e:
#         print(f"Could not fetch or parse sitemap {sitemap_url}: {e}")
#         return

#     print(f"Found {len(urls)} URLs. Starting processing with {max_workers} workers...")
    
#     session = setup_session()
    
#     with ThreadPoolExecutor(max_workers=max_workers) as executor:
#         future_to_url = {executor.submit(process_url, url, session): url for url in urls}
        
#         for future in as_completed(future_to_url):
#             url = future_to_url[future]
#             try:
#                 processed_url, status = future.result()
#                 if status == "Success":
#                     print(f"[SUCCESS] Completed URL ---> {processed_url}")
#                 else:
#                     print(f"[FAILURE] URL: {processed_url} | Status: {status}")
#             except Exception as e:
#                 print(f"[ERROR] An unexpected error occurred for URL {url}: {e}")

#     try:
#         print("Flushing final changes to the database...")
#         client.flush(collection_name="app_documents")
#         print("Processing complete.")
#     except Exception as e:
#         print(f"Error during final flush: {e}")
    
        


# def multivector_hybrid_search(
#     query_text: str,
#     org_id: str,
#     connector_ids: List[str],
#     limit=30,
#     expr: str | None = None,
#     expr_params: dict | None = None,
#     alpha: float = 0.5,  # Weight between vector and keyword search (0-1)
#     title_content_ratio: float = 0.3  # Weight between title and content (0-1)
# ):
#     """
#     Implements multivector hybrid search similar to Vespa schema.

#     Args:
#         query_text: Search query
#         org_id: Organization ID filter
#         connector_ids: List of connector IDs to filter by
#         limit: Maximum number of results
#         expr: Additional expression filter
#         expr_params: Parameters for expression
#         alpha: Weight between vector similarity (alpha) and keyword similarity (1-alpha)
#         title_content_ratio: Weight between title (title_content_ratio) and content (1-title_content_ratio)
#     """
#     query_embedding = create_embeddings(query_text)

#     # Build the expression based on whether connector_ids is empty
#     base_expr = f"org_id == '{org_id}'"
#     if connector_ids:
#         connector_expr = f"connector_id in {connector_ids}"
#         if expr:
#             full_expr = f"{base_expr} and {expr} and {connector_expr}"
#         else:
#             full_expr = f"{base_expr} and {connector_expr}"
#     else:
#         if expr:
#             full_expr = f"{base_expr} and {expr}"
#         else:
#             full_expr = base_expr

#     # Search 1: Content dense vector search
#     search_param_content = {
#         "data": [query_embedding],
#         "anns_field": "content_dense_vector",
#         "param": {
#             "metric_type": "IP",
#             "params": {
#                 "nprobe": 10,
#                 "radius": 0.35,
#                 "range_filter": 1.0
#             }
#         },
#         "limit": limit,
#         "expr": full_expr,
#         "expr_params": expr_params
#     }
#     request_content = AnnSearchRequest(**search_param_content)

#     # Search 2: Title dense vector search
#     search_param_title = {
#         "data": [query_embedding],
#         "anns_field": "title_dense_vector",
#         "param": {
#             "metric_type": "IP",
#             "params": {
#                 "nprobe": 10,
#                 "radius": 0.35,
#                 "range_filter": 1.0
#             }
#         },
#         "limit": limit,
#         "expr": full_expr,
#         "expr_params": expr_params
#     }
#     request_title = AnnSearchRequest(**search_param_title)

#     # Search 3: Content sparse vector (BM25) search
#     search_param_content_bm25 = {
#         "data": [query_text],
#         "anns_field": "content_sparse_vector",
#         "param": {
#             "metric_type": "BM25",
#         },
#         "limit": limit,
#         "expr": full_expr,
#         "expr_params": expr_params
#     }
#     request_content_bm25 = AnnSearchRequest(**search_param_content_bm25)

#     # Search 4: Title sparse vector (BM25) search
#     search_param_title_bm25 = {
#         "data": [query_text],
#         "anns_field": "title_sparse_vector",
#         "param": {
#             "metric_type": "BM25",
#         },
#         "limit": limit,
#         "expr": full_expr,
#         "expr_params": expr_params
#     }
#     request_title_bm25 = AnnSearchRequest(**search_param_title_bm25)

#     # Combine all searches
#     reqs = [request_content, request_title, request_content_bm25, request_title_bm25]

#     # Use RRF ranker for initial ranking
#     ranker = RRFRanker(100)

#     results = client.hybrid_search(
#         collection_name="app_documents",
#         reqs=reqs,
#         ranker=ranker,
#         output_fields=["document_id", "chunk_index", "content", "title"],
#         limit=limit
#     )

#     # Post-process results to implement the weighted scoring logic from Vespa
#     processed_results = []

#     for result in results:
#         # Extract scores from different search types
#         # Note: This is a simplified approach - in practice you'd need to track
#         # which score comes from which search type in the hybrid search results

#         # For now, we'll use the RRF score and apply the weighting logic
#         # In a full implementation, you'd need to modify the hybrid search
#         # to return individual scores from each search type

#         processed_results.append({
#             "document_id": result.get("document_id"),
#             "chunk_index": result.get("chunk_index"),
#             "content": result.get("content"),
#             "title": result.get("title"),
#             "score": result.get("score", 0.0)
#         })

#     return processed_results


# def advanced_multivector_search(
#     query_text: str,
#     org_id: str,
#     connector_ids: List[str],
#     limit=30,
#     expr: str | None = None,
#     expr_params: dict | None = None,
#     alpha: float = 0.5,
#     title_content_ratio: float = 0.3
# ):
#     """
#     Advanced multivector search with separate scoring for each component.
#     This requires multiple separate searches and manual score combination.
#     """
#     query_embedding = create_embeddings(query_text)

#     # Build the expression
#     base_expr = f"org_id == '{org_id}'"
#     if connector_ids:
#         connector_expr = f"connector_id in {connector_ids}"
#         if expr:
#             full_expr = f"{base_expr} and {expr} and {connector_expr}"
#         else:
#             full_expr = f"{base_expr} and {connector_expr}"
#     else:
#         if expr:
#             full_expr = f"{base_expr} and {expr}"
#         else:
#             full_expr = base_expr

#     # Perform separate searches for each component
#     # Content vector search
#     content_vector_results = client.search(
#         collection_name="app_documents",
#         data=[query_embedding],
#         anns_field="content_dense_vector",
#         param={
#             "metric_type": "IP",
#             "params": {"nprobe": 10, "radius": 0.35, "range_filter": 1.0}
#         },
#         limit=limit,
#         expr=full_expr,
#         expr_params=expr_params,
#         output_fields=["document_id", "chunk_index", "content", "title"]
#     )

#     # Title vector search
#     title_vector_results = client.search(
#         collection_name="app_documents",
#         data=[query_embedding],
#         anns_field="title_dense_vector",
#         param={
#             "metric_type": "IP",
#             "params": {"nprobe": 10, "radius": 0.35, "range_filter": 1.0}
#         },
#         limit=limit,
#         expr=full_expr,
#         expr_params=expr_params,
#         output_fields=["document_id", "chunk_index", "content", "title"]
#     )

#     # Content BM25 search
#     content_bm25_results = client.search(
#         collection_name="app_documents",
#         data=[query_text],
#         anns_field="content_sparse_vector",
#         param={"metric_type": "BM25"},
#         limit=limit,
#         expr=full_expr,
#         expr_params=expr_params,
#         output_fields=["document_id", "chunk_index", "content", "title"]
#     )

#     # Title BM25 search
#     title_bm25_results = client.search(
#         collection_name="app_documents",
#         data=[query_text],
#         anns_field="title_sparse_vector",
#         param={"metric_type": "BM25"},
#         limit=limit,
#         expr=full_expr,
#         expr_params=expr_params,
#         output_fields=["document_id", "chunk_index", "content", "title"]
#     )

#     # Combine and score results
#     all_docs = {}

#     # Process content vector results
#     for result in content_vector_results:
#         doc_id = result.get("document_id")
#         if doc_id not in all_docs:
#             all_docs[doc_id] = {
#                 "document_id": doc_id,
#                 "chunk_index": result.get("chunk_index"),
#                 "content": result.get("content"),
#                 "title": result.get("title"),
#                 "content_vector_score": result.get("score", 0.0),
#                 "title_vector_score": 0.0,
#                 "content_bm25_score": 0.0,
#                 "title_bm25_score": 0.0
#             }
#         else:
#             all_docs[doc_id]["content_vector_score"] = result.get("score", 0.0)

#     # Process title vector results
#     for result in title_vector_results:
#         doc_id = result.get("document_id")
#         if doc_id not in all_docs:
#             all_docs[doc_id] = {
#                 "document_id": doc_id,
#                 "chunk_index": result.get("chunk_index"),
#                 "content": result.get("content"),
#                 "title": result.get("title"),
#                 "content_vector_score": 0.0,
#                 "title_vector_score": result.get("score", 0.0),
#                 "content_bm25_score": 0.0,
#                 "title_bm25_score": 0.0
#             }
#         else:
#             all_docs[doc_id]["title_vector_score"] = result.get("score", 0.0)

#     # Process content BM25 results
#     for result in content_bm25_results:
#         doc_id = result.get("document_id")
#         if doc_id not in all_docs:
#             all_docs[doc_id] = {
#                 "document_id": doc_id,
#                 "chunk_index": result.get("chunk_index"),
#                 "content": result.get("content"),
#                 "title": result.get("title"),
#                 "content_vector_score": 0.0,
#                 "title_vector_score": 0.0,
#                 "content_bm25_score": result.get("score", 0.0),
#                 "title_bm25_score": 0.0
#             }
#         else:
#             all_docs[doc_id]["content_bm25_score"] = result.get("score", 0.0)

#     # Process title BM25 results
#     for result in title_bm25_results:
#         doc_id = result.get("document_id")
#         if doc_id not in all_docs:
#             all_docs[doc_id] = {
#                 "document_id": doc_id,
#                 "chunk_index": result.get("chunk_index"),
#                 "content": result.get("content"),
#                 "title": result.get("title"),
#                 "content_vector_score": 0.0,
#                 "title_vector_score": 0.0,
#                 "content_bm25_score": 0.0,
#                 "title_bm25_score": result.get("score", 0.0)
#             }
#         else:
#             all_docs[doc_id]["title_bm25_score"] = result.get("score", 0.0)

#     # Apply Vespa-style scoring logic
#     final_results = []
#     for doc in all_docs.values():
#         # Implement the title_vector_score logic from Vespa
#         # max(closeness(field, embeddings), closeness(field, title_embedding))
#         title_vector_score = max(doc["content_vector_score"], doc["title_vector_score"])

#         # Calculate weighted scores
#         vector_score = (
#             title_content_ratio * title_vector_score +
#             (1 - title_content_ratio) * doc["content_vector_score"]
#         )

#         keyword_score = (
#             title_content_ratio * doc["title_bm25_score"] +
#             (1 - title_content_ratio) * doc["content_bm25_score"]
#         )

#         # Final weighted score
#         final_score = (
#             alpha * vector_score +
#             (1 - alpha) * keyword_score
#         )

#         doc["final_score"] = final_score
#         final_results.append(doc)

#     # Sort by final score
#     final_results.sort(key=lambda x: x["final_score"], reverse=True)

#             title_content_ratio * doc["title_bm25_score"] +
#             (1 - title_content_ratio) * doc["content_bm25_score"]
#         )
        
#         # Final weighted score
#         final_score = (
#             alpha * vector_score +
#             (1 - alpha) * keyword_score
#         )
        
#         doc["final_score"] = final_score
#         final_results.append(doc)

#     # Sort by final score
#     final_results.sort(key=lambda x: x["final_score"], reverse=True)
    
