import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Simple validation function for demonstration. Replace with zod/yup for production.
const validateBody = (body: any) => {
    if (!body || typeof body !== "object") return false
    // Require a paymentMethodId field (adjust as needed for your logic)
    if (!body.paymentMethodId || typeof body.paymentMethodId !== "string") return false
    return true
}

/**
 * POST /store/custom/stripe/set-payment-method
 * Sets the Stripe payment method for a cart or customer.
 */
export default async function handler(req: MedusaRequest, res: MedusaResponse) {
    try {
        // Only allow POST
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" })
        }

        // Validate request body
        if (!validateBody(req.body)) {
            return res.status(400).json({ error: "Invalid request body" })
        }

        // TODO: Add your Stripe logic here
        // Example: Save payment method to DB, call Stripe API, etc.
        // const { paymentMethodId } = req.body

        // For now, just echo back the request body
        return res.status(200).json({ success: true, received: req.body })
    } catch (err) {
        // Log the error for debugging (do not expose details to client)
        console.error("Stripe set-payment-method error:", err)
        return res.status(500).json({ error: "Internal server error" })
    }
} 