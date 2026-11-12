# Architecture rules

- Generate administrative invitations only in a server-side function after checking the caller's authenticated identity and persisted admin role; keep elevated credentials out of the browser.
- Share invitation links on the application origin using token hashes verified by the password-setup page; never expose backend verification URLs in user-facing links.