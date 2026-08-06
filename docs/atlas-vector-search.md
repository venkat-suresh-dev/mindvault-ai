# Atlas Vector Search setup

Create the following Atlas Search index on the `booksegments` collection (confirm the deployed collection name if MongoDB applies a custom pluralization). This application does not create indexes at runtime.

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 768,
        "similarity": "cosine"
      },
      "bookId": {
        "type": "objectId"
      }
    }
  }
}
```

Name the index `book_segments_vector_index`, or set `aiConfig.retrieval.vectorIndexName` to the infrastructure-managed name before deployment. This Atlas cluster requires the legacy `mappings` format; the newer `fields` format is rejected. The 768 dimensions and cosine metric must match the existing normalized `gemini-embedding-001` vectors. Deploy the index and wait for it to become queryable before enabling chat in production.

Every query applies `bookId` as an Atlas `$vectorSearch` filter after the route has fetched that book using the authenticated Clerk user. Do not remove this filter or replace it with client-provided authorization.
# Lifecycle note

Vector search remains independent from knowledge generation. Knowledge artifacts are stable successful output; `KnowledgeGeneration` owns progress, retry, cancellation, and checkpoint state. Embedding accounting records only provider-attempt metadata and never stores document text or vectors.
