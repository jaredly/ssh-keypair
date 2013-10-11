# Generate and SSH keypair with `ssh-keygen`

## keygen(comment, path, callback(err))
Generate the keys at the given path. `path` will be the private, and
`path + '.pub'` will be the public key.

## keygen(comment, callback(err, privkey, pubkey))
Generate the keys to a random path and return them as strings.
