export class DeskError extends Error {
  constructor(
    public code:
      | 'invalid-argument'
      | 'unauthenticated'
      | 'permission-denied'
      | 'failed-precondition'
      | 'resource-exhausted'
      | 'aborted'
      | 'not-found',
    message: string
  ) {
    super(message)
  }
}
