class ApiResponse {
	constructor(success, message, data = null) {
	  this.success = success;
	  this.message = message;
	  this.data = data;
	}
  
	static success(message, data = null) {
	  return new ApiResponse(true, message, data);
	}
  
	static error(message, data = null) {
	  return new ApiResponse(false, message, data);
	}
  }
  
  export default ApiResponse;



  
//api stattus code 
// Informational responses (100–199)
// Successful responses (200–299)
// Redirects (300–399)
// Client errors (400–499)
// Server errors(500-599)