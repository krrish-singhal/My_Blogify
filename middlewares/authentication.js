const jwt = require("jsonwebtoken");

const secretKey = "$uperMan@123";

function checkForAuthenticationCookie(tokenName) {
  return (req, res, next) => {
    const token = req.cookies[tokenName];
    if (!token) {
      req.user = null; 
      return next();
    }

    try {
      const decoded = jwt.verify(token, secretKey);  
      req.user = decoded; 
    } catch (error) {
      req.user = null; 
    }

    next();  
  };
}

module.exports = { checkForAuthenticationCookie };
