describe('CVUpload Component', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  describe('File Input', () => {
    it('should accept PDF files', () => {
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF file content'),
        fileName: 'resume.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.get('input[type="file"]').should('have.value', 'C:\\fakepath\\resume.pdf')
    })

    it('should reject non-PDF files with error message', () => {
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Wrong type'),
        fileName: 'document.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }, { force: true })
      cy.contains('Le fichier doit être un PDF valide').should('be.visible')
      // The input may still hold a value; ensure no selected-file UI is shown
      cy.contains('Fichier sélectionné').should('not.exist')
    })

    it('should show error when file exceeds max size', () => {
      // Create a buffer larger than 10MB
      const largeBuffer = new Array(11 * 1024 * 1024).fill('x').join('')
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from(largeBuffer),
        fileName: 'large-file.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Le fichier dépasse la limite de 10 MB').should('be.visible')
    })

    it('should clear error message when selecting a valid file after error', () => {
      // First, select an invalid file
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Invalid'),
        fileName: 'invalid.txt',
        mimeType: 'text/plain'
      }, { force: true })
      cy.contains('Le fichier doit être un PDF valide').should('be.visible')

      // Then select a valid file
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'valid.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Le fichier doit être un PDF valide').should('not.exist')
    })
  })

  describe('Upload Button', () => {
    it('should be disabled initially', () => {
      cy.contains('Télécharger le CV').should('be.disabled')
    })

    it('should be enabled after file selection', () => {
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').should('be.enabled')
    })

    it('should show loading state during upload', () => {
      cy.intercept('POST', '**/upload-cv', (req) => {
        req.reply((res) => {
          // Delay response to see loading state
          setTimeout(() => {
            res.send({ statusCode: 200 })
          }, 1000)
        })
      })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()
      cy.contains('Téléchargement en cours...').should('be.visible')
      cy.contains('Téléchargement en cours...').should('be.disabled')
    })
  })

  describe('Error Handling', () => {
    it('should show error when no file is selected', () => {
      cy.contains('Télécharger le CV').should('be.disabled')
    })

    it('should display network error gracefully', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 500 })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      // Wait for error message
      cy.contains('Erreur').should('be.visible')
    })

    it('should show API error message', () => {
      cy.intercept('POST', '**/upload-cv', {
        statusCode: 400,
        body: { detail: 'Invalid CV format' }
      })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      cy.contains('Invalid CV format').should('be.visible')
    })
  })

  describe('Success States', () => {
    it('should show success message after successful upload', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'Extracted CV text content' }
      })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      cy.contains('CV téléchargé').should('be.visible')
    })

    it('should clear file input after successful upload', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'Extracted text' }
      })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      cy.get('input[type="file"]').invoke('val').should('equal', '')
    })

    it('should call onUploadSuccess callback with filename', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'Extracted text' }
      })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'my-cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      // Verify success message contains filename
      cy.contains('my-cv.pdf').should('be.visible')
    })
  })

  describe('UI Elements', () => {
    it('should display upload icon', () => {
      cy.get('[class*="lucide"]').should('have.length.greaterThan', 0)
    })

    it('should have proper accessibility attributes', () => {
      cy.get('input[type="file"]').should('have.attr', 'accept', '.pdf')
    })
  })
})
