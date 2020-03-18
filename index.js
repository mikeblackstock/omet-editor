import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

// Our launcher
const register = (core, args, options, metadata) => {
  // Create a new Application instance
const proc = core.make('osjs/application', {args, options, metadata});
const vfs = core.make('osjs/vfs');
let files= [];
let stashedContents;
const stashFile = function(contents) {
	stashedContents= contents;

};
const notify= (msg) => {
	core.make('osjs/notification', {
		timeout:0,
 		message: msg,
//  	icon: 'icon.src',
    	onclick: () => console.log('Clicked!')
	});	
};
  // Create  a new Window instance
 proc.createWindow({
 	attributes: {
    	closeable:true
  	},
 
    title: metadata.title.en_EN,
    dimension: {width: 460, height:500},
    position: 'center'
  })
  .on('destroy', () => proc.destroy())
  .render(($content, win) => {
  	  	
    // Add our process and window id to iframe URL
    const suffix = `?pid=${proc.pid}&wid=${win.wid}`;

    // Create an iframe
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.src = proc.resource('/data/index.html') + suffix;
    iframe.setAttribute('border', '0');

    // Bind window events to iframe
    win.on('blur', () => iframe.contentWindow.blur());
    win.on('focus', () => iframe.contentWindow.focus());
    proc.on('iframe:post', msg => iframe.contentWindow.postMessage(msg, window.location.href));

    // Listen for messages from iframe
    // and send to server via websocket
    win.on('iframe:get', msg => {
		
 		switch (msg[0]) {
 			case "readFile":
 				let file= JSON.parse(msg[1]);
 				proc.emit("iframe:post", ["updateEditor", stashedContents]);
// 				vfs.readfile(file)
// 				.then(contents => console.log(contents))
// 				.catch(error => console.error(error)); // FIXME: Dialog
 				break;
 			case "getFiles":
 				console.log(files);
 				alert("Check log");
 				break;
 			case "restore":
 				core.run("Editor", msg[1]);
 				break;
 		}

// 		proc.send(msg);
    });
 	proc.on('attention', (args) => {
		
		if (args.file) {

		vfs.readfile(args.file)
			.then(contents => proc.emit('iframe:post', ["createEditorPane", JSON.stringify(args.file), contents]))
			.catch(error => console.error(error)); // FIXME: Dialog
		}	
		
		
		else {

			proc.emit('iframe:post', args);
		}

	});
  	if (proc.args.file) {

  		iframe.src= iframe.src + "&file=" + JSON.stringify(proc.args.file);

//  		const suffix = `?file=${JSON.stringify(proc.args.file)}`;
//  		iframe.src = proc.resource('/data/index.html') + suffix;
		vfs.readfile(proc.args.file)
			.then(contents => stashFile(contents))
			.catch(error => console.error(error)); // FIXME: Dialog
	
  	}		
	
	
    $content.appendChild(iframe);
    
  });
  
 


  return proc;
};

// Creates the internal callback function when OS.js launches an application
osjs.register(applicationName, register);
