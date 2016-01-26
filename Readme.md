# Generate an SSH keypair with `ssh-keygen`

## keygen(comment, path, callback(err))
Generate the keys at the given path. `path` will be the private, and
`path + '.pub'` will be the public key.

## keygen(comment, options, callback(err))
Specify an `options` object with fields `path` (used as above) and `type` (which
determines the type of keys generated - default "rsa", with "ecdsa" being a good
option if your system supports it).

## keygen(comment, callback(err, privkey, pubkey))
Generate the keys to a random path and return them as strings.
