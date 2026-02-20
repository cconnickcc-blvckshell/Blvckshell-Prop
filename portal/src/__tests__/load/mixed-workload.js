import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "2m", target: 300 },
    { duration: "3m", target: 500 },
    { duration: "2m", target: 500 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

const baseURL = __ENV.BASE_URL || "http://localhost:3000";

// Simulate different user types based on VU number
export default function () {
  const userType = __VU % 4;

  if (userType === 0) {
    // Worker: View jobs and submit completions
    simulateWorker();
  } else if (userType === 1) {
    // Admin: Review and approve jobs
    simulateAdmin();
  } else if (userType === 2) {
    // Public: Submit contact form
    simulatePublic();
  } else {
    // Worker: View earnings
    simulateWorkerEarnings();
  }

  sleep(Math.random() * 2 + 1);
}

function simulateWorker() {
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
    "worker jobs loaded": (r) => r.status === 200,
  });
}

function simulateAdmin() {
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

  // View admin dashboard
  const adminRes = http.get(`${baseURL}/admin/jobs`, { headers });
  check(adminRes, {
    "admin dashboard loaded": (r) => r.status === 200,
  });

  // View invoices
  const invoicesRes = http.get(`${baseURL}/admin/invoices`, { headers });
  check(invoicesRes, {
    "invoices loaded": (r) => r.status === 200,
  });
}

function simulatePublic() {
  // Submit contact form
  const leadRes = http.post(
    `${baseURL}/api/lead`,
    JSON.stringify({
      name: `Test User ${__VU}`,
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

function simulateWorkerEarnings() {
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

  // View earnings
  const earningsRes = http.get(`${baseURL}/earnings`, { headers });
  check(earningsRes, {
    "earnings loaded": (r) => r.status === 200,
  });
}
