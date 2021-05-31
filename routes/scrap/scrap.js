var express = require("express");
var router = express.Router();

const crypto = require("crypto-promise");

const authUtil = require("../../module/utils/authUtils");
const defaultRes = require("../../module/utils/utils");
const statusCode = require("../../module/utils/statusCode");
const resMessage = require("../../module/utils/responseMessage");
const db = require("../../module/pool");

/*
스크랩 변경
METHOD       : PUT
URL          : /scrap
BODY         : p_idx = 향수 고유 id
*/
router.put("/", authUtil.isLoggedin, async (req, res) => {
  const p_idx = req.body.p_idx;
  if (!p_idx || !req.decoded) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE)
      );
  }
  try {
    const selectScrapQuery =
      "SELECT * FROM Scrap WHERE u_idx = ? and p_idx = ?";
    const selectScrapResult = await db.queryParam_Arr(selectScrapQuery, [
      req.decoded.u_idx,
      p_idx,
    ]);

    if (!selectScrapResult[0]) {
      const insertScrapQuery = "INSERT INTO Scrap (u_idx, p_idx) VALUES (?, ?)";
      const insertScrapResult = await db.queryParam_Arr(insertScrapQuery, [
        req.decoded.u_idx,
        p_idx,
      ]);

      return res
        .status(200)
        .send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_SCRAP));
    } else {
      const deleteScrapQuery =
        "DELETE FROM Scrap WHERE u_idx = ? and p_idx = ?";
      const deleteScrapResult = await db.queryParam_Arr(deleteScrapQuery, [
        req.decoded.u_idx,
        p_idx,
      ]);

      return res
        .status(200)
        .send(
          defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_DELETE_SCRAP)
        );
    }
  } catch (error) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.FAIL_CHANGE_SCRAP_STATE
        )
      );
  }
});

/*
스크랩 조회
METHOD       : GET
URL          : /scrap
*/
router.get("/", authUtil.isLoggedin, async (req, res, next) => {
  var perfume_list = new Array();

  if (!req.decoded) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE)
      );
  }

  try {
    const selectScrapQuery =
      "SELECT * FROM Perfume JOIN Scrap ON Perfume.p_idx = Scrap.p_idx WHERE Scrap.u_idx = ?";
    const selectScrapResult = await db.queryParam_Parse(
      selectScrapQuery,
      req.decoded.u_idx
    );

    if (!selectScrapResult[0]) {
      return res
        .status(200)
        .send(defaultRes)
        .successTrue(statusCode.OK, resMessage.NOT_EXIST_SCRAP);
    }

    for (var perfumeIndex in selectScrapResult) {
      var perfume = {
        p_idx: "",
        p_name: "",
        brand: "",
        description: "",
        notes: [],
        image: "",
        similarity: 0,
        isScrapped: true,
      };

      perfume.p_idx = selectScrapResult[perfumeIndex].p_idx;
      perfume.p_name = selectScrapResult[perfumeIndex].p_name;
      perfume.brand = selectScrapResult[perfumeIndex].brand;
      perfume.description = selectScrapResult[perfumeIndex].description
        .trim()
        .replace(/\"+/gi, '"')
        .replace(/\//gi, ",");
      perfume.notes = selectScrapResult[perfumeIndex].notes
        .trim()
        .replace(/\/ /gm, "/")
        .split("/");

      perfume.image = selectScrapResult[perfumeIndex].image;

      perfume_list.push(perfume);
    }

    res
      .status(200)
      .send(
        defaultRes.successTrue(
          statusCode.OK,
          resMessage.SUCCESS_SELECT_SCRAP,
          perfume_list
        )
      );
  } catch (error) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.FAIL_SELECT_SCRAP
        )
      );
  }
});

module.exports = router;
