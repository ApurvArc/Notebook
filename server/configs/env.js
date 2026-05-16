const requiredEnv = ["MONGO_URI", "JWT_SECRET"];

const validateEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

export default validateEnv;
