import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 200 },
    { duration: "2m", target: 400 },
    { duration: "3m", target: 500 },
    { duration: "5m", target: 500 }, // Hold at peak
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
    http_reqs: ["rate>200"], // At least 200 req/s at peak
  },
};

const baseURL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const userType = __VU % 5;

  switch (userType) {
    case 0:
      simulateWorkerJobCompletion();
      break;
    case 1:
      simulateAdminReview();
      break;
    case 2:
      simulatePublicContact();
      break;
    case 3:
      simulateWorkerViewJobs();
      break;
    case 4:
      simulateAdminInvoice();
      break;
  }

  sleep(Math.random() * 3 + 1);
}

function simulateWorkerJobCompletion() {
  // Login
  const loginRes = http.post(`${baseURL}/api/auth/callback/credentials`, {
    email: `worker${__VU}@test.com`,
    password: "test123456",
  });

  if (loginRes.status !== 200 && loginRes.status !== 302) {
    errorRate.add(1);
    return;
  }

  const cookies = loginRes.cookies;
  const sessionCookie = cookies["next-auth.session-token"]?.[0]?.value;
  if (!sessionCookie) {
    errorRate.add(1);
    return;
  }

  const headers = {
    Cookie: `next-auth.session-token=${sessionCookie}`,
  };

  // View jobs
  const jobsRes = http.get(`${baseURL}/jobs`, { headers });
  check(jobsRes, {
    "jobs loaded": (r) => r.status === 200,
  });

  // Submit completion
  const submitRes = http.post(
    `${baseURL}/api/jobs/test-job-id/submit`,
    JSON.stringify({
      checklistResults: { item1: { result: "PASS" } },
    }),
    {
      headers: { ...headers, "Content-Type": "application/json" },
    }
  );

  check(submitRes, {
    "completion submitted": (r) => r.status === 200 || r.status === 404,
  });
}

function simulateAdminReview() {
  const loginRes = http.post(`${baseURL}/api/auth/callback/credentials`, {
    email: `admin${__VU}@test.com`,
    password: "test123456",
  });

  if (loginRes.status !== 200 && loginRes.status !== 302) {
    errorRate.add(1);
    return;
  }

  const cookies = loginRes.cookies;
  const sessionCookie = cookies["next-auth.session-token"]?.[0]?.value;
  if (!sessionCookie) {
    errorRate.add(1);
    return;
  }

  const headers = {
    Cookie: `next-auth.session-token=${sessionCookie}`,
  };

  // View pending jobs
  const jobsRes = http.get(`${baseURL}/admin/jobs`, { headers });
  check(jobsRes, {
    "admin jobs loaded": (r) => r.status === 200,
  });

  // Approve job
  const approveRes = http.post(
    `${baseURL}/api/admin/jobs/test-job-id/approve`,
    {},
    { headers }
  );

  check(approveRes, {
    "job approved": (r) => r.status === 200 || r.status === 404,
  });
}

function simulatePublicContact() {
  const leadRes = http.post(
    `${baseURL}/api/lead`,
    JSON.stringify({
      name: `User ${__VU}`,
      email: `user${__VU}@test.com`,
      message: "Test inquiry",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(leadRes, {
    "contact form submitted": (r) => r.status === 200,
  });
}

function simulateWorkerViewJobs() {
  const loginRes = http.post(`${baseURL}/api/auth/callback/credentials`, {
    email: `worker${__VU}@test.com`,
    password: "test123456",
  });

  if (loginRes.status !== 200 && loginRes.status !== 302) {
    errorRate.add(1);
    return;
  }

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

  // View earnings
  const earningsRes = http.get(`${baseURL}/earnings`, { headers });
  check(earningsRes, {
    "earnings loaded": (r) => r.status === 200,
  });
}

function simulateAdminInvoice() {
  const loginRes = http.post(`${baseURL}/api/auth/callback/credentials`, {
    email: `admin${__VU}@test.com`,
    password: "test123456",
  });

  if (loginRes.status !== 200 && loginRes.status !== 302) {
    errorRate.add(1);
    return;
  }

  const cookies = loginRes.cookies;
  const sessionCookie = cookies["next-auth.session-token"]?.[0]?.value;
  if (!sessionCookie) {
    errorRate.add(1);
    return;
  }

  const headers = {
    Cookie: `next-auth.session-token=${sessionCookie}`,
  };

  // View invoices
  const invoicesRes = http.get(`${baseURL}/admin/invoices`, { headers });
  check(invoicesRes, {
    "invoices loaded": (r) => r.status === 200,
  });

  // View invoice PDF
  const pdfRes = http.get(`${baseURL}/api/invoices/test-invoice-id/pdf`, {
    headers,
  });
  check(pdfRes, {
    "PDF generated": (r) => r.status === 200 || r.status === 404,
  });
}
