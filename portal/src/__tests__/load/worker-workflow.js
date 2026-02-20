import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "2m", target: 250 },
    { duration: "3m", target: 500 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

const baseURL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Simulate worker login
  const loginRes = http.post(`${baseURL}/api/auth/callback/credentials`, {
    email: `worker${__VU}@test.com`,
    password: "test123456",
  });

  const loginSuccess = check(loginRes, {
    "login successful": (r) => r.status === 200 || r.status === 302,
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }

  // Get session cookie
  const cookies = loginRes.cookies;
  const sessionCookie = cookies["next-auth.session-token"]?.[0]?.value;

  if (!sessionCookie) {
    errorRate.add(1);
    return;
  }

  const headers = {
    Cookie: `next-auth.session-token=${sessionCookie}`,
  };

  // View jobs list
  const jobsRes = http.get(`${baseURL}/jobs`, { headers });
  check(jobsRes, {
    "jobs list loaded": (r) => r.status === 200,
  });

  sleep(1);

  // View job detail (if jobs exist)
  if (jobsRes.status === 200) {
    const jobDetailRes = http.get(`${baseURL}/jobs/test-job-id`, { headers });
    check(jobDetailRes, {
      "job detail loaded": (r) => r.status === 200 || r.status === 404,
    });
  }

  sleep(2);

  // Simulate draft save
  const draftRes = http.post(
    `${baseURL}/api/jobs/test-job-id/draft`,
    JSON.stringify({
      checklistResults: { item1: { result: "PASS" } },
      notes: "Test draft",
    }),
    {
      headers: { ...headers, "Content-Type": "application/json" },
    }
  );

  check(draftRes, {
    "draft saved": (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}
