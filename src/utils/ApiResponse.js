class ApiResponse {
	constructor(statusCode, message, data = null) {
	  this.statusCode = success;
	  this.message = message;
	  this.data = data;
	  this.success = statusCode < 400
	}
  
  }
  
  export {  ApiResponse };



  
//api stattus code 
// Informational responses (100–199)
// Successful responses (200–299)
// Redirects (300–399)
// Client errors (400–499)
// Server errors(500-599)