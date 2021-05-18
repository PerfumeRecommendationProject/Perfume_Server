var express = require("express");
var router = express.Router();

router.use("/auth", require("./auth/index"));
router.use("/scrap", require("./scrap/index"));
router.use("/perfume", require("./perfume/index"));

module.exports = router;
