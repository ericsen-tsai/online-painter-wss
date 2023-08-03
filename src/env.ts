import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

export const env = createEnv({
  /*
   * Specify what prefix the client-side variables must have.
   * This is enforced both on type-level and at runtime.
   */
  clientPrefix: 'PUBLIC_',
  server: {
    PORT: z.string().min(1),
    CORS_ORIGIN: z.string().optional(),
  },
  client: {},
  /**
   * What object holds the environment variables at runtime.
   * Often `process.env` or `import.meta.env`
   */
  runtimeEnv: process.env,
})
