import { conversationRepository } from '../repositories/conversation.repository'
import { OpenAI } from 'openai/client.js'

// Implementation Details
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatResponse {
  id: string
  message: string
}

// Public Interface
export const chatService = {
  sendMessage: async (
    prompt: string,
    conversationId: string
  ): Promise<ChatResponse> => {
    const response = await openaiClient.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 50,
      previous_response_id: conversationRepository.get(conversationId),
    })

    conversationRepository.set(conversationId, response.id)

    return {
      id: response.id,
      message: response.output_text,
    }
  },

  sendBankSMS: async (sms: string) => {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: sms }],
      temperature: 0.2,
      max_tokens: 150,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'bank_transaction_verification',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              is_bank_transaction: {
                type: 'boolean',
                description:
                  'True if this is a valid sms bank transaction, false otherwise',
              },
              transaction: {
                anyOf: [
                  {
                    $ref: '#/$defs/transaction',
                  },
                  {
                    type: 'null',
                    description: 'Null if the sms is not a bank transaction',
                  },
                ],
                description:
                  'Full transaction information if a valid bank transaction, error if not, or null if not a transaction sms',
              },
            },
            required: ['is_bank_transaction', 'transaction'],
            additionalProperties: false,
            $defs: {
              transaction: {
                anyOf: [
                  {
                    type: 'object',
                    properties: {
                      bank: {
                        type: 'string',
                        description:
                          'Name of the bank in English language only (no non-ASCII or non-English names allowed)',
                        pattern: "^[A-Za-z0-9 .,'&()-]{1,}$",
                      },
                      card_type: {
                        type: 'string',
                        description:
                          "Type of the card used (must be 'Credit Card' or 'Debit Card')",
                        enum: ['Credit Card', 'Debit Card'],
                      },
                      card_last_4_digits: {
                        type: 'string',
                        description: 'Last 4 digits of the card',
                        pattern: '^[0-9]{4}$',
                      },
                      date: {
                        type: 'string',
                        description: 'Transaction date in YYYY-MM-DD',
                        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                      },
                      type: {
                        type: 'string',
                        description: 'Type of transaction',
                        enum: ['debit', 'credit'],
                      },
                      merchant: {
                        type: 'string',
                        description: 'Merchant or recipient name',
                      },
                      amount: {
                        type: 'number',
                        description: 'Transaction amount',
                      },
                      currency: {
                        type: 'string',
                        description:
                          'Currency of the transaction (ISO 4217 code)',
                        minLength: 3,
                        maxLength: 3,
                      },
                      category: {
                        type: 'string',
                        description:
                          'Transaction category, predicted intelligently from merchant name',
                        enum: [
                          'food',
                          'transport',
                          'groceries',
                          'entertainment',
                          'shopping',
                          'utilities',
                          'health',
                          'education',
                          'travel',
                          'cash withdrawal',
                          'rent',
                          'salary',
                          'insurance',
                          'subscriptions',
                          'charity',
                          'taxes',
                          'investment',
                          'fees',
                          'other',
                        ],
                      },
                    },
                    required: [
                      'bank',
                      'card_type',
                      'card_last_4_digits',
                      'date',
                      'type',
                      'merchant',
                      'amount',
                      'currency',
                      'category',
                    ],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        description:
                          'Message indicating the SMS is not a valid bank transaction',
                      },
                    },
                    required: ['error'],
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
        },
      },
    })

    return {
      id: response.id,
      message: response,
    }
  },
}
