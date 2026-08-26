/** Thrown instead of rejecting when the notice cannot be delivered. */
export class RejectEmailError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "RejectEmailError";
  }
}
