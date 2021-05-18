var express = require("express");
const crypto = require("crypto");
var router = express.Router();

const defaultRes = require("../../module/utils/utils");
const statusCode = require("../../module/utils/statusCode");
const resMessage = require("../../module/utils/responseMessage");
const db = require("../../module/pool");
const loginUtil = require("../../module/utils/loginUtil");
const jwtUtils = require("../../module/jwt");

/*
카카오 로그인
METHOD       : POST
URL          : /login
BODY         : kakaoToken = 카카오 accessToken
*/

router.post("/", async (req, res) => {
  const userId = req.body.userId;
  const kakaoToken = req.body.kakaoToken;

  try {
    // let userId;
    // userId = await loginUtil.kakao(kakaoToken);

    if (!userId || !kakaoToken) {
      return res
        .status(200)
        .send(
          defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE)
        );
    }

    const selectUserQuery = "SELECT * FROM User WHERE id = ?";
    const createUserQuery =
      "INSERT INTO User (id, password, passwordSalt) VALUES (?, ?, ?)";
    const salt = crypto.randomBytes(64).toString("base64");
    const hashedPw = crypto
      .pbkdf2Sync(kakaoToken, salt, 10000, 64, "sha512")
      .toString("base64");

    let user = await db.queryParam_Parse(selectUserQuery, userId);

    if (!user[0]) {
      console.log("in");
      user = await db.queryParam_Arr(createUserQuery, [userId, hashedPw, salt]);
    }
    const token = jwtUtils.sign(user);
    //loginUtil.blindPassword(user);

    return res
      .status(200)
      .send(
        defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_LOGIN, token)
      );
  } catch (err) {
    console.log(err);
    return res
      .status(200)
      .send(
        defaultRes.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.FAIL_LOGIN
        )
      );
  }
});

module.exports = router;
