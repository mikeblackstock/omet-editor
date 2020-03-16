module.exports = (core, proc) => ({
  onmessage: (ws, respond, params) => {
 //   if (params[0] === 'Ping') {
 		console.log("MESSAGE FROM CLIENT");
      respond('Pong from server');
      
 //   }
  }
});