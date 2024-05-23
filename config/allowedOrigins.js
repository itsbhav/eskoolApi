const allowedOrigins = [
    prpcess.env.FRONTEND_HOST,
    process.env.BACKEND_HOST
]

module.exports = allowedOrigins;