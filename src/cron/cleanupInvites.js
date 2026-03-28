// backend/cron/cleanupInvites.js
const cron = require('node-cron');
const { db } = require('../database');

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        const result = await db.query(`
            DELETE FROM employee_invites 
            WHERE expires_at < NOW() 
            AND used = FALSE
            RETURNING id, email, secret_code
        `);
        
        console.log(`Deleted ${result.rows.length} expired invite codes`);
        
        // Optional: Log to file or send notification
        if (result.rows.length > 0) {
            // Send admin notification
            await sendAdminNotification({
                type: 'expired_codes_cleanup',
                count: result.rows.length,
                codes: result.rows
            });
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
});