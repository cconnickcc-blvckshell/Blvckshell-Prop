// k6 load testing configuration
export const options = {
  stages: [
    { duration: "30s", target: 50 },   // Ramp up to 50 users
    { duration: "1m", target: 100 },    // Ramp up to 100 users
    { duration: "2m", target: 250 },    // Ramp up to 250 users
    { duration: "3m", target: 500 },    // Hold at 500 users
    { duration: "1m", target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],  // 95% of requests under 2s
    http_req_failed: ["rate<0.01"],      // Less than 1% errors
    http_reqs: ["rate>100"],              // At least 100 req/s
  },
};

export const baseURL = __ENV.BASE_URL || "http://localhost:3000";
