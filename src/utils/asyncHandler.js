
// Async Handler using Promise and catch block

const asyncHandler = fn => return(err, req, res, next) =>{
	Promise.resolve(fn(req, res, next)).catch( err => { 
		console.log(err)
		res.status(500).json({
			success: false,
			message: err.message
		})
	})
}


export {asyncHandler}

// Async Handler ussing try catch block

// const asyncHandler = fn => async(req, res, next) => { 
// 	try{
// 		await fn(req, res, next)
// 	}
// 	catch(err) {
// 		res.status(500).json({
// 			success: false,
// 			message: err.message})
// 	}
// }