var crypto = require('crypto'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    Step = require('step'),
    pathJoin = require('path').join,
    os = require('os');

/*
 * keygen(comment, options, callback)
 *
 * Fork a child process to run ssh-keygen and generate a DSA SSH Key Pair
 * with no passphrase. Does not return the contents of the keys, leaves them
 * on the filesystem.
 *
 * <comment> The comment to put in the public key
 * <options> String of output path, or object with these possible fields:
 *     <path> Base output file path. Pubkey will be path + ".pub". If not
 *            specified, a tmp file will be used, and callback will be called
 *            with (err, privkey, pubkey)j
 *     <type> The type of key to create (default "rsa")
 * <callback> function(exitcode) or function(err, privkey, pubkey) if no path is given
 */
module.exports = function (comment, options, callback) {
  var readfiles = false,
      random_str,
      path,
      type = 'rsa';

  if (typeof options === "function" && arguments.length === 2) {
    // No third argument, default options
    callback = options;
    readfiles = true;
    random_str = crypto.randomBytes(16).toString('hex');
    path = pathJoin(os.tmpdir(), random_str);
  } else if (typeof options === "string") {
    // Second argument is string, assume it specifies path
    path = options;
  } else if (typeof options === 'object') {
    // Second argument is object, pull out fields
    if (typeof options.type === 'string') {
      type = options.type;
    }
    if (typeof options.path === 'string') {
      path = options.path;
    }
  } else {
    return new Error('Bad arguments, see README');
  }

  var cmd = "ssh-keygen";
  var args = ["-C", comment, "-t", type, "-f", path, "-N"];
  if (process.platform === 'win32') {
    args.push("''");
  } else {
    args.push("");
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
      var next = this;

      spawn(cmd, args).on("exit", function(code) {
        if (readfiles) return next(code);
        // if we're not reading the files, we're done
        callback(code && new Error('failed to generate keypair'));
      });
    },
    function stepThree(err) {
      if (err) return callback(new Error('failed to generate keypair'));
      var one = this.parallel(),
          two = this.parallel();
      fs.readFile(path, 'utf8', function (err, data) {
        fs.unlink(path, function (err2) {
          one(err || err2, data);
        });
      });
      fs.readFile(path + '.pub', 'utf8', function (err, data) {
        fs.unlink(path + '.pub', function (err2) {
          two(err || err2, data);
        });
      });
    },
    callback
  );
};
