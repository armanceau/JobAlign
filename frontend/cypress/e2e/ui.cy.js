describe('UI and Accessibility', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('shows header, tagline and stepper labels', () => {
    cy.contains('JobAlign').should('be.visible')
    cy.contains('Analysez votre CV et trouvez le job parfait').should('be.visible')
    cy.contains('CV').should('be.visible')
    cy.contains('Offre').should('be.visible')
    cy.contains('Résultats').should('be.visible')
  })

  it('has a hidden file input with accept .pdf and a visible drop area', () => {
    cy.get('#cv-input').should('have.attr', 'accept', '.pdf')
    cy.get('#cv-input').should('have.class', 'hidden')
    cy.contains('Glissez un PDF ou cliquez pour sélectionner').should('be.visible')
  })

  it('buttons have accessible labels and proper states', () => {
    cy.contains('Télécharger le CV').should('exist')
    // 'Suivant' is displayed on the CV step
    cy.contains('Suivant').should('exist')
    // 'Analyser le CV' is displayed in the 'Offre' step, open it and check
    cy.get('button[aria-label="Offre"]').click()
    cy.contains('Analyser le CV').should('exist')
    // Navigate to step 3 (Résultats) and assert default empty state
    cy.get('button[aria-label="Résultats"]').click()
    cy.contains('Aucune analyse disponible.').should('be.visible')

    // Now perform a mocked full flow to produce results and verify step 3 shows them
    cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
    cy.intercept('POST', '**/extract-cv-text', { statusCode: 200, body: { text: 'Extracted CV text' } })
    cy.intercept('POST', '**/nlp/analyze', {
      statusCode: 200,
      body: {
        cv: { hard_skills: ['React'], soft_skills: [], diplomas: [], experiences: [], entities: [] },
        offer: { hard_skills: [], soft_skills: [], diplomas: [], experiences: [], entities: [] },
        summary: { shared_hard_skills: ['React'], shared_soft_skills: [], shared_diplomas: [], shared_languages: [] },
        matching: { method: 'det', global_score_percent: 90, subscores: { technical_skills: { score_percent: 90, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' }, experience: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' }, education: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' }, soft_skills: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' }, language: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' } } }
      }
    })

    // Upload CV and run analysis
    cy.get('button[aria-label="CV"]').click()
    cy.get('#cv-input').selectFile({ contents: Cypress.Buffer.from('PDF'), fileName: 'ui-test.pdf', mimeType: 'application/pdf' }, { force: true })
    cy.contains('Télécharger le CV').click()
    cy.get('button[aria-label="Offre"]').click()
    cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type('Test offer for UI')
    cy.contains('Analyser le CV').click()
    // Go to results and assert — find the stepper item by label then click its button
    cy.contains('Résultats').closest('li').find('button').click()
    cy.contains('Hard skills communes').should('be.visible')
    cy.contains('React').should('be.visible')
  })
})
