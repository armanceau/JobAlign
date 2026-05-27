describe('Error Flows', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('shows upload network error gracefully', () => {
    cy.intercept('POST', '**/upload-cv', { statusCode: 500 })

    cy.get('#cv-input').selectFile({
      contents: Cypress.Buffer.from('PDF'),
      fileName: 'err.pdf',
      mimeType: 'application/pdf'
    }, { force: true })

    cy.contains('Télécharger le CV').click()
    cy.contains('Erreur').should('be.visible')
  })

  it('shows extract API error message if present', () => {
    cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
    cy.intercept('POST', '**/extract-cv-text', { statusCode: 400, body: { detail: 'Extraction failed' } })

    cy.get('#cv-input').selectFile({
      contents: Cypress.Buffer.from('PDF'),
      fileName: 'err2.pdf',
      mimeType: 'application/pdf'
    }, { force: true })

    cy.contains('Télécharger le CV').click()
    cy.contains('Extraction failed').should('be.visible')
  })

  it('shows analyze API error message when analyze fails', () => {
    cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
    cy.intercept('POST', '**/extract-cv-text', { statusCode: 200, body: { text: 'text' } })
    cy.intercept('POST', '**/nlp/analyze', { statusCode: 400, body: { detail: 'Analyse invalide' } })

    cy.get('#cv-input').selectFile({
      contents: Cypress.Buffer.from('PDF'),
      fileName: 'err3.pdf',
      mimeType: 'application/pdf'
    }, { force: true })

    cy.contains('Télécharger le CV').click()
    cy.get('button[aria-label="Offre"]').click()
    cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type('Offer')
    cy.contains('Analyser le CV').click()

    cy.contains('Analyse invalide').should('be.visible')
  })
})
