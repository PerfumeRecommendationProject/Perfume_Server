var express = require("express");
var router = express.Router();

// 향수 데이터 등록
router.use("/data", require("./data"));
router.use("/search", require("./search"));

module.exports = router;
