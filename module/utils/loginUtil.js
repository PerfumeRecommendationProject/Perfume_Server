const axios = require("axios");

const loginUtil = {
  kakao: async (token) => {
    try {
      const tokenInfo = await axios({
        method: "get",
        url: "https://kapi.kakao.com/v1/user/access_token_info",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userId = tokenInfo.data.id;
      return userId;
    } catch (err) {
      return null;
    }
  },
  blindPassword: (user) => {
    user.password = "";
    user.passwordSalt = "";
  },
};

module.exports = loginUtil;
