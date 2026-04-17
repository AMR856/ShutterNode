import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    heavy_load: {
      executor: "ramping-arrival-rate",
      startRate: 50,
      timeUnit: "1s",
      preAllocatedVUs: 200,
      maxVUs: 500,
      stages: [
        { duration: "10s", target: 100 },
        { duration: "20s", target: 300 },
        { duration: "20s", target: 500 },
        { duration: "10s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95) < 2000"],
    http_req_failed: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.LOADTEST_URL || "http://localhost:6000";

function randomEmail() {
  const id = `${__VU}-${__ITER}-${Math.floor(Math.random() * 100000)}`;
  return `k6user-${id}@example.com`;
}

export default function () {
  const email = randomEmail();
  const password = "Password123!";
  const jsonHeaders = { "Content-Type": "application/json" };

  const resLogin = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ email, password }),
    {
      headers: jsonHeaders,
      tags: { endpoint: "login" },
      responseCallback: http.expectedStatuses(200, 401),
    },
  );

  check(resLogin, {
    "login ok": (r) => [200, 401].includes(r.status),
  });

  const token =
    resLogin.status === 200 &&
    resLogin.cookies.token &&
    resLogin.cookies.token.length
      ? resLogin.cookies.token[0].value
      : null;

  const authOptions = {
    headers: jsonHeaders,
    cookies: token ? { token } : {},
    responseCallback: http.expectedStatuses(200, 401),
  };

  const action = Math.random();

  if (action < 0.5) {
    const res = http.get(`${BASE_URL}/images?page=1&limit=10`, {
      ...authOptions,
      tags: { endpoint: "image-list" },
    });

    check(res, {
      "image list ok": (r) => [200, 401].includes(r.status),
    });
  } else if (action < 0.8) {
    const res = http.get(
      `${BASE_URL}/images/get-image?publicId=nonexistent-${Date.now()}`,
      {
        ...authOptions,
        tags: { endpoint: "get-image" },
        responseCallback: http.expectedStatuses(401, 404),
      },
    );

    check(res, {
      "get image ok": (r) => [401, 404].includes(r.status),
    });
  } else {
    const payload = {
      transformations: {
        resize: { width: 100, height: 100 },
      },
    };

    const res = http.post(
      `${BASE_URL}/images/transform?id=nonexistent-${Date.now()}`,
      JSON.stringify(payload),
      {
        ...authOptions,
        tags: { endpoint: "transform" },
        responseCallback: http.expectedStatuses(200, 401, 404),
      },
    );

    check(res, {
      "transform ok": (r) => [200, 401, 404].includes(r.status),
    });
  }

  sleep(0.1);
}