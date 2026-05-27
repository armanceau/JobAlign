// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Prevent tests from failing on uncaught exceptions originating from app code
// (useful when backend endpoints are intentionally mocked)
Cypress.on('uncaught:exception', () => {
	return false
})

// Provide default mocks for NLP endpoints to avoid 404/500 when backend is not available.
beforeEach(() => {
	const defaultAnalyzeBody = {
		cv: { hard_skills: [], soft_skills: [], diplomas: [], experiences: [], entities: [] },
		offer: { hard_skills: [], soft_skills: [], diplomas: [], experiences: [], entities: [] },
		summary: { shared_hard_skills: [], shared_soft_skills: [], shared_diplomas: [], shared_languages: [] },
		matching: {
			method: 'deterministic',
			global_score_percent: 0,
			subscores: {
				technical_skills: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
				experience: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
				education: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
				soft_skills: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
				language: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' }
			}
		}
	}

	cy.intercept('POST', '**/nlp/recommendations', { statusCode: 200, body: {
		missing_keywords: [],
		improvements: [],
		reformulations: [],
		summary: ''
	} })

	cy.intercept('POST', '**/nlp/analyze', (req) => {
		// allow individual tests to override by calling cy.intercept earlier
		req.reply({ statusCode: 200, body: defaultAnalyzeBody })
	})
})