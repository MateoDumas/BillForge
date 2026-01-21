import { pool } from "../db";

export type JobStatus = 'running' | 'completed' | 'failed';

export interface JobLogEntry {
  id: string;
  job_name: string;
  status: JobStatus;
  started_at: Date;
  completed_at?: Date;
  details?: any;
}

export class JobService {
  /**
   * Starts a new job execution record.
   * @param jobName Name of the job (e.g., 'DailyBilling', 'Dunning')
   * @param details Initial details
   * @returns The UUID of the job record
   */
  static async startJob(jobName: string, details?: any): Promise<string> {
    const result = await pool.query(
      `INSERT INTO job_history (job_name, status, started_at, details)
       VALUES ($1, 'running', NOW(), $2)
       RETURNING id`,
      [jobName, details ? JSON.stringify(details) : null]
    );
    return result.rows[0].id;
  }

  /**
   * Updates a job's status and details.
   */
  static async updateJob(id: string, details: any) {
    await pool.query(
      `UPDATE job_history 
       SET details = details || $2::jsonb, 
           updated_at = NOW()
       WHERE id = $1`,
      [id, JSON.stringify(details)]
    );
  }

  /**
   * Marks a job as completed.
   */
  static async completeJob(id: string, details?: any) {
    await pool.query(
      `UPDATE job_history 
       SET status = 'completed', 
           completed_at = NOW(),
           details = CASE WHEN $2::jsonb IS NOT NULL THEN details || $2::jsonb ELSE details END
       WHERE id = $1`,
      [id, details ? JSON.stringify(details) : null]
    );
  }

  /**
   * Marks a job as failed.
   */
  static async failJob(id: string, error: Error | string, details?: any) {
    const errorMsg = error instanceof Error ? error.message : error;
    const failureDetails = {
      ...details,
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined
    };

    await pool.query(
      `UPDATE job_history 
       SET status = 'failed', 
           completed_at = NOW(),
           details = details || $2::jsonb
       WHERE id = $1`,
      [id, JSON.stringify(failureDetails)]
    );
  }

  /**
   * Retrieves job history.
   */
  static async getJobHistory(limit: number = 50, offset: number = 0) {
    const result = await pool.query(
      `SELECT * FROM job_history ORDER BY started_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}
