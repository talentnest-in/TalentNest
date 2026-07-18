# k6 Load Testing

## Prerequisites

Install k6: https://k6.io/docs/getting-started/installation/

## Test Types

| Test | Command | Target | Duration |
|------|---------|--------|----------|
| Smoke | `k6 run load-tests/k6/smoke-test.js` | Validate core endpoints | 30s |
| Load (100) | `k6 run -e STAGE=100 load-tests/k6/load-test.js` | 100 concurrent users | 5m |
| Load (500) | `k6 run -e STAGE=500 load-tests/k6/load-test.js` | 500 concurrent users | 10m |
| Load (1000) | `k6 run -e STAGE=1000 load-tests/k6/load-test.js` | 1000 concurrent users | 15m |
| Load (5000) | `k6 run -e STAGE=5000 load-tests/k6/load-test.js` | 5000 concurrent users | 30m |
| Stress | `k6 run load-tests/k6/stress-test.js` | Ramp 100→2000 users | 15m |
| Spike | `k6 run load-tests/k6/spike-test.js` | Sudden 0→2000 users | 10m |

## Customizing Target

```bash
k6 run -e BASE_URL=https://api.talentnest.com load-tests/k6/load-test.js
```

## Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| p(95) latency | < 3s | 95th percentile response time |
| p(99) latency | < 5s | 99th percentile response time |
| Error rate | < 5% | Requests returning 5xx |
| Throughput | 1000+ req/s | Sustained requests per second |
| Static assets | < 200ms p(95) | Non-API endpoints |

## Expected Behavior

- **100 users**: All endpoints respond within 500ms p(95)
- **500 users**: API endpoints within 2s p(95), errors < 1%
- **1000 users**: Within 3s p(95), errors < 3%
- **5000 users**: Within 5s p(99), errors < 10% (graceful degradation expected)
- **Spike (2000)**: System recovers within 1 minute of surge

## Output

Results include:
- HTTP request duration (min/avg/med/p90/p95/max)
- Request rate (req/s)
- Error rate (%)
- Checks passed/failed

Use `--out json` for programmatic analysis:
```bash
k6 run --out json=results.json load-tests/k6/smoke-test.js
```
