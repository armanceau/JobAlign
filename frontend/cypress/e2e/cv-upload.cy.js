describe('CV Upload Only', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('uploads a PDF and shows success, then clears the input', () => {
    // Mock upload and extract endpoints
    cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
    cy.intercept('POST', '**/extract-cv-text', {
      statusCode: 200,
      body: { text: 'Extracted CV content' }
    })

    const fileName = 'candidate-only.pdf'

    // Ensure CV step is active and select file
    cy.get('button[aria-label="CV"]').click()
    cy.get('#cv-input').selectFile({
      contents: Cypress.Buffer.from('PDF content'),
      fileName,
      mimeType: 'application/pdf'
    }, { force: true })

    // Start upload
    cy.contains('Télécharger le CV').click()

    // Success message from component should contain filename
    cy.contains(`CV téléchargé et texte extrait avec succès: ${fileName}`).should('be.visible')

    // Input should be cleared after success
    cy.get('#cv-input').invoke('val').should('equal', '')
  })
})
