var express = require("express");
var router = express.Router();

const crypto = require("crypto-promise");

const authUtil = require("../../../module/utils/authUtils");
const defaultRes = require("../../../module/utils/utils");
const statusCode = require("../../../module/utils/statusCode");
const resMessage = require("../../../module/utils/responseMessage");
const db = require("../../../module/pool");
const { PythonShell } = require("python-shell");

/*
새로운 향수 추천
METHOD       : POST
URL          : /recommend/new
BODY         : input_desc = 사용자 input_desc
*/
router.post("/", authUtil.isLoggedin, async (req, res) => {
  const input_desc = req.body.input_desc;
  if (!input_desc) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE)
      );
  }

  let options = {
    scriptPath: "/home/ubuntu/perfume_PJ/routes/main",
    // scriptPath: "C:/Users/s_0hyeon/Desktop/perfume_PJ/routes/main",
    args: [input_desc],
  };
  let python_code = new PythonShell("perfume_recommendation.py", options);

  const rec_perfume = new Array();

  python_code.on("message", (message) => {
    slice_message = message.slice(1, message.length - 1).split(",");

    for (var i = 0; i < 3; i++) {
      result = slice_message[i].split(":");

      var data = {
        p_idx: result[0].trim(),
        similarity: result[1].trim(),
      };

      rec_perfume.push(data);
    }
  });

  python_code.end(async (err) => {
    if (err) {
      console.log(err);
      return res
        .status(200)
        .send(defaultRes.successTrue(statusCode.OK, "분석실패", err));
    }
    try {
      var perfume_list = new Array();

      const selectPerfumeQuery =
        "SELECT * FROM Perfume WHERE p_idx IN (?, ?, ?)";

      const selectPerfumeResult = await db.queryParam_Arr(selectPerfumeQuery, [
        rec_perfume[0].p_idx,
        rec_perfume[1].p_idx,
        rec_perfume[2].p_idx,
      ]);

      var rec_perfume_index = 0;
      for (var perfumeIndex in selectPerfumeResult) {
        var perfume = {
          p_idx: "",
          p_name: "",
          brand: "",
          description: "",
          notes: [],
          image: "",
          similarity: rec_perfume[rec_perfume_index].similarity,
          isScrapped: false,
        };

        perfume.p_idx = selectPerfumeResult[perfumeIndex].p_idx;
        perfume.p_name = selectPerfumeResult[perfumeIndex].p_name;
        perfume.brand = selectPerfumeResult[perfumeIndex].brand;
        perfume.description = selectPerfumeResult[perfumeIndex].description
          .trim()
          .replace(/\"+/gi, '"')
          .replace(/\//gi, ",");
        perfume.notes = selectPerfumeResult[perfumeIndex].notes
          .trim()
          .replace(/\/ /gm, "/")
          .split("/");

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
        rec_perfume_index += 1;
      }
      return res
        .status(200)
        .send(
          defaultRes.successTrue(
            statusCode.OK,
            resMessage.SUCCESS_RECOMMEND_PERFUME_NEW,
            perfume_list
          )
        );
    } catch (error) {
      console.log(error);
      return res
        .status(200)
        .send(
          defaultRes.successFalse(
            statusCode.INTERNAL_SERVER_ERROR,
            resMessage.FAIL_RECOMMEND_PERFUME_NEW
          )
        );
    }
  });

  //   PythonShell.run("perfume_recommendation.py", options, (err, data) => {
  //     if (err) {
  //       console.log(err);
  //       return res
  //         .status(200)
  //         .send(defaultRes.successTrue(statusCode.OK, "분석실패", err));
  //     }
  //     const rec_perfume = new Array();
  //     for (item in data) {
  //       var result = {
  //         p_idx: item,
  //         similarity: data[item],
  //       };
  //       rec_perfume.push(result);
  //     }

  //     try {
  //       var perfume_list = new Array();

  //       const selectPerfumeQuery =
  //         "SELECT * FROM Perfume WHERE p_idx IN (?, ?, ?)";

  //       const selectPerfumeResult = await db.queryParam_Arr(selectPerfumeQuery, [
  //         rec_perfume[0].p_idx,
  //         rec_perfume[1].p_idx,
  //         rec_perfume[2].p_idx,
  //       ]);

  //       var rec_perfume_index = 0;
  //       for (var perfumeIndex in selectPerfumeResult) {
  //         var perfume = {
  //           p_idx: "",
  //           p_name: "",
  //           brand: "",
  //           description: "",
  //           notes: [],
  //           image: "",
  //           similarity: rec_perfume[rec_perfume_index].similarity,
  //           isScrapped: false,
  //         };

  //         perfume.p_idx = selectPerfumeResult[perfumeIndex].p_idx;
  //         perfume.p_name = selectPerfumeResult[perfumeIndex].p_name;
  //         perfume.brand = selectPerfumeResult[perfumeIndex].brand;
  //         perfume.description = selectPerfumeResult[perfumeIndex].description
  //           .trim()
  //           .replace(/\"+/gi, '"')
  //           .replace(/\//gi, ",");
  //         perfume.notes = selectPerfumeResult[perfumeIndex].notes
  //           .trim()
  //           .replace(/\/ /gm, "/")
  //           .split("/");

  //         perfume.image = selectPerfumeResult[perfumeIndex].image;

  //         if (req.decoded != null) {
  //           const selectScrapPerfumeQuery =
  //             "SELECT * FROM Scrap WHERE p_idx = ? and u_idx = ?";
  //           const selectScrapPerfumeResult = await db.queryParam_Arr(
  //             selectScrapPerfumeQuery,
  //             [perfume.p_idx, req.decoded.u_idx]
  //           );

  //           if (selectScrapPerfumeResult[0] != null) {
  //             perfume.isScrapped = true;
  //           }
  //         }

  //         perfume_list.push(perfume);
  //         rec_result_index = rec_result_index + 1;
  //       }
  //       return res
  //         .status(200)
  //         .send(
  //           defaultRes.successTrue(
  //             statusCode.OK,
  //             resMessage.SUCCESS_RECOMMEND_PERFUME_NEW,
  //             perfume_list
  //           )
  //         );
  //     } catch (error) {
  //         console.log(error)
  //       return res
  //         .status(200)
  //         .send(
  //           defaultRes.successFalse(
  //             statusCode.INTERNAL_SERVER_ERROR,
  //             resMessage.FAIL_RECOMMEND_PERFUME_NEW
  //           )
  //         );
  //     }

  //     // fs.writeFileSync(
  //     //   "/home/ubuntu/kusitms_companyPJ/routes/analyze_result.json",
  //     //   data
  //     // );
  //     // const result = JSON.parse(data);

  //     return res
  //       .status(200)
  //       .send(defaultRes.successTrue(statusCode.OK, "분석성공", data));
  //   });
});
module.exports = router;
