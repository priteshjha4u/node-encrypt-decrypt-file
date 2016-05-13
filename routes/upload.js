var express = require('express');
var router = express.Router();

var multer  = require('multer');
var upload = multer({ dest: 'uploads/tmp/'});
var fs = require('fs'), crypto = require('crypto');

router.get('/', function(req, res, next) {
  res.json({
	status : "error",
	message : "Invalid Request"
  });
});

router.get('/getCiphers', function(req, res, next) {
  var list = crypto.getCiphers();
  res.json({status:"success",data: list.length ? list.join() : ""});
});

router.post('/', function(req, res, next) {
  res.json({
	status : "error",
	message : "Invalid Request"
  });
});

router.get('/getUploadedFiles', function(req, res, next) {
	fs.readdir("uploads/", function(err, files) {
		if(err) {
			console.log("Error:", err);
			res.json({status:"error",message:"Something went wrong."});
			return false;
		}
		files.splice(files.indexOf("tmp"), 1);
		res.json({status:"success", data: files.length ? files.join("@@") : ""});
	});
});

router.post('/uploadFile', upload.single('inputFile'), function(req, res, next) {
	if(!req.file) {
		res.json({status:"error",message:"Please upload a file."});
		return false;
	}
	var tmp_path = req.file.path, fname = req.file.originalname, key = req.body.ekey || null;
	if(!key) {
		fs.unlinkSync(tmp_path);
		res.json({status:"error",message:"Encryption key is required."});
		return false;
	}
	var algo = req.body.ealgo || 'aes-256-cbc';
	var _key = new Buffer(key).toString('base64'), _algo = new Buffer(algo).toString('base64');
	var target_path = 'uploads/' + "__" + _key + "__" + _algo + "__" + Date.now() + "__" + fname + ".enc";
	var cipher = crypto.createCipher(algo, key);
	var src = fs.createReadStream(tmp_path);
	var dest = fs.createWriteStream(target_path);
	src.pipe(cipher).pipe(dest);
	dest.on("error", function(err) {
		console.log(err);
		res.json({status:"error",message:"Something went wrong."});
	});
	dest.on("finish", function() {
		fs.unlinkSync(tmp_path);
		res.json({
			status : "success",
			message : "File uploaded and encrypted successfully"
		});
	});
});

router.post('/downloadFile', function(req, res, next) {
	var key = req.body.key || null;
	var file = req.body.file || null;
	if(!key || !file) {
		res.redirect('/#'+encodeURIComponent("Either encryption or file is not provided"));
		return false;
	}
	var _key = file.split("__")[1];
	if(new Buffer(_key, 'base64').toString('ascii') != key) {
		res.redirect('/#'+encodeURIComponent("Incorrect encryption key provided."));
		return false;
	}
	var _file = "uploads/"+file;
	var algo = new Buffer(file.split("__")[2], 'base64').toString('ascii');
	var target_path = 'uploads/' + file.split("__")[4].split(".").slice(0,2).join(".");
	var decipher = crypto.createDecipher(algo, key);
	var src = fs.createReadStream(_file);
	var dest = fs.createWriteStream(target_path);
	src.pipe(decipher).pipe(dest);
	dest.on("error", function(err) {
		console.log(err);
		res.end("<h1>Something went wrong</h1><br><a href='/'>Go Back</a>");
		return false;
	});
	dest.on("finish", function() {
		res.download(target_path, file.split("__")[4].split(".").slice(0,2).join("."), function(err){
			if (err) {
			console.log(err);
			} else {
				fs.unlinkSync(target_path);
			}
		});
	});
});

router.post('/deleteFile', function(req, res, next) {
	var file = req.body.filename || null;
	if(file) {
		fs.unlink('uploads/'+file, function(err) {
			if(err) {
				console.log(err);
				res.json({status:"error", message: "Something went wrong"});
			} else {
				res.json({status:"success"});
			}
		});
	} else {
		res.json({status:"error", message: "Invalid file"});
	}
});



module.exports = router;
