var express = require("express");
var router = express.Router();

const crypto = require("crypto-promise");

const authUtil = require("../../../module/utils/authUtils");
const defaultRes = require("../../../module/utils/utils");
const statusCode = require("../../../module/utils/statusCode");
const resMessage = require("../../../module/utils/responseMessage");
const db = require("../../../module/pool");

/*
기존향수 기반 향수 추천
METHOD       : POST
URL          : /recommend/based
BODY         : p_idx = 사용자가 가지고 있는 향수의 p_idx
*/
router.post("/", authUtil.isLoggedin, async (req, res) => {
  const p_idx = req.body.p_idx;
  if (!p_idx) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE)
      );
  }
  console.log(p_idx);
  //머신러닝 모델에 input_desc 넘기고 추천 결과로 받은 p_idx가 [2, 3, 7]이라고 가정
  const rec_result = [
    { p_idx: 2, similarity: 80 },
    { p_idx: 3, similarity: 60 },
    { p_idx: 7, similarity: 70 },
  ];
  try {
    var perfume_list = new Array();
    //TODO : 향수 추천 결과 항상 세개로 고정되어있는지 이거보다 적개 나올 수도 있는지?? 물어보고 나중에 머신러닝 붙일 때 바꾸기
    const selectPerfumeQuery = "SELECT * FROM Perfume WHERE p_idx IN (?, ?, ?)";
    const selectPerfumeNotesQuery =
      "SELECT note FROM Perfume_notes WHERE p_idx = ?";
    const selectPerfumeResult = await db.queryParam_Arr(selectPerfumeQuery, [
      rec_result[0].p_idx,
      rec_result[1].p_idx,
      rec_result[2].p_idx,
    ]);

    for (var perfumeIndex in selectPerfumeResult) {
      const selectPerfumeNotesResult = await db.queryParam_Parse(
        selectPerfumeNotesQuery,
        selectPerfumeResult[perfumeIndex].p_idx
      );

      var perfume = {
        p_idx: "",
        p_name: "",
        brand: "",
        description: "",
        notes: [],
        image: "",
        similarity: rec_result[perfumeIndex].similarity,
        isScrapped: false,
      };

      perfume.p_idx = selectPerfumeResult[perfumeIndex].p_idx;
      perfume.p_name = selectPerfumeResult[perfumeIndex].p_name;
      perfume.brand = selectPerfumeResult[perfumeIndex].brand;
      perfume.description = selectPerfumeResult[perfumeIndex].description;

      selectPerfumeNotesResult.forEach((item) => {
        perfume.notes.push(item.note);
      });

      perfume.image = selectPerfumeResult[perfumeIndex].image;

      if (req.decoded != null) {
        const selectScrapPerfumeQuery =
          "SELECT * FROM Scrap WHERE p_idx = ? and u_idx = ?";
        const selectScrapPerfumeResult = await db.queryParam_Arr(
          selectScrapPerfumeQuery,
          [perfume.p_idx, req.decoded.u_idx]
        );

        if (selectScrapPerfumeResult[0] != null) {
          perfume.isScrapped = true;
        }
      }

      perfume_list.push(perfume);
    }
    return res
      .status(200)
      .send(
        defaultRes.successTrue(
          statusCode.OK,
          resMessage.SUCCESS_RECOMMEND_PERFUME_BASED,
          perfume_list
        )
      );
  } catch (error) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.FAIL_RECOMMEND_PERFUME_BASED
        )
      );
  }
});
module.exports = router;
