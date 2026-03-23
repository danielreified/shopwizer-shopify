export const BULK_OPERATION_RUN_QUERY = `#graphql
  mutation bulkRun($query: String!) {
    bulkOperationRunQuery(query: $query) {
      bulkOperation { id status }
      userErrors { field message }
    }
  }
`;

export const CURRENT_BULK_OPERATION = `#graphql
  query CurrentBulkOp {
    currentBulkOperation {
      id
      status
      errorCode
      createdAt
      completedAt
      objectCount
      fileSize
      url
    }
  }
`;