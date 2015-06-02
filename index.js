var crypto = require('crypto')
  , fs = require('fs')
  , spawn = require('child_process').spawn
  , Step = require('step')
  , pathJoin = require('path').join
  , os = require('os')

/*
 * keygen(comment, path, callback) or keygen(comment, callback)
 *
 * Fork a child process to run ssh-keygen and generate a DSA SSH Key Pair
 * with no passphrase. Does not return the contents of the keys, leaves them
 * on the filesystem.
 *
 * <comment> The comment to put in the public key
 * <path> Base output file path. Pubkey will be path + ".pub". If not
 *        specified, a tmp file will be used, and callback will be called
 *        with (err, privkey, pubkey)j
 * <callback> function(exitcode) or function(err, privkey, pubkey) if no path is given
 */
module.exports = function (comment, path, callback) {
  var readfiles = false
    , random_str

  if (arguments.length === 2) {
    readfiles = true
    random_str = crypto.randomBytes(16).toString('hex');
    callback = path
    path = pathJoin(os.tmpdir(), random_str)
  }

  var cmd = "ssh-keygen";
  var args = ["-C", comment, "-f", path, "-N"]
  if (process.platform === 'win32') {
    args.push("''")
  } else {
    args.push("")
  }
  Step(
    function stepOne() {
      try {
        fs.unlink(path, this.parallel());
        fs.unlink(path + ".pub", this.parallel());
      } catch(e) {
        // do nothing
      }
    },
    function stepTwo() {
      var next = this

      spawn(cmd, args).on("exit", function(code) {
        if (readfiles) return next(code)
        // if we're not reading the files, we're done
        callback(code && new Error('failed to generate keypair'));
      })
    },
    function stepThree(err) {
      if (err) return callback(new Error('failed to generate keypair'))
      var one = this.parallel()
        , two = this.parallel()
      fs.readFile(path, 'utf8', function (err, data) {
        fs.unlink(path, function (err2) {
          one(err || err2, data)
        })
      })
      fs.readFile(path + '.pub', 'utf8', function (err, data) {
        fs.unlink(path + '.pub', function (err2) {
          two(err || err2, data)
        })
      })
    },
    callback
  )
}
