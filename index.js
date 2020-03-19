import osjs from 'osjs';
import {name as applicationName} from './metadata.json';

// Our launcher
const register = (core, args, options, metadata) => {
  // Create a new Application instance
const proc = core.make('osjs/application', {args, options, metadata});
const vfs = core.make('osjs/vfs');
const settings = core.make('osjs/settings');

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
  	console.log("SETTINGS:\n");
  	console.log(settings.get('osjs/application/Editor').files);  	
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
 
 			case "saveSettings":
//settings.set('osjs/application/Editor', 'files', null);
 				settings.set('osjs/application/Editor', 'files', msg[1]);
 				console.log("Settings saved");
 				break;
 				
 			case "getSettings":
 				console.log(settings.get('osjs/application/Editor').files);
 
 				break;
 			case "restore":
 				let files= settings.get('osjs/application/Editor').files;
 				for (let i=0; i < files.length; i++) {
// 					proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), "stub"]);
				vfs.readfile(files[i])
				.then(contents => proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), contents]))
				.catch(error => console.error(error)); // FIXME: Dialog
				}	
	
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
  	else {
			
 				let files= settings.get('osjs/application/Editor').files;
 				for (let i=0; i < files.length; i++) {
// 					proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), "stub"]);
				vfs.readfile(files[i])
				.then(contents => proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), contents]))
				.catch(error => console.error(error)); // FIXME: Dialog
			}

  	}
 /* 	
	if (settings.get('osjs/application/Editor').files.length > 0) {
		let files= settings.get('osjs/application/Editor').files;
 			for (let i=0; i < files.length; i++) {
// 					proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), "stub"]);
				vfs.readfile(files[i])
				.then(contents => proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), contents]))
				.catch(error => console.error(error)); // FIXME: Dialog
			}

	}
*/
    $content.appendChild(iframe);
    
  });
  
 


  return proc;
};

// Creates the internal callback function when OS.js launches an application
osjs.register(applicationName, register);
