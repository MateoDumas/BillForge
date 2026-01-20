import "dotenv/config";
import { runDailyBillingJob } from "./billingJob";

runDailyBillingJob()
  .then(() => {
    console.log("Billing job completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Billing job failed", error);
    process.exit(1);
  });

