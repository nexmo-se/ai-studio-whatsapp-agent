// A dummy utils.js for local development
let data = {
    key: "",
    secret: "",
    app_id: "",
    keyfile: "", // ex: "./app_to_app_with_pstn_fallback.key"
    region: "", //ex: "SG"
    phone:""
}

let id = '533'; // any random number

module.exports = {
  getDb: () => {},
  getNexmo: (id) => new Promise((resolve, reject) => {
    resolve(data);
  }),
  getIdFromJWT: (nids, token) => {
    return token
  },
  getBearerToken: () => {return id},
  getIniStuff: () => {
    return data;
  }
}