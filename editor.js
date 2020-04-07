import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {
  h,
  app
} from 'hyperapp';


import {
  Box,
  BoxContainer,
  Image,
  Video,
  Menubar,
  MenubarItem
} from '@osjs/gui';


// Our launcher
const register = (core, args, options, metadata) => {
  // Create a new Application instance
const proc = core.make('osjs/application', {args, options, metadata});
const vfs = core.make('osjs/vfs');
const settings = core.make('osjs/settings');
let files= [];
let stashedContents;
const stashFile = function(contents) {
	stashedContents= contents;

};
const notify= (msg) => {
	core.make('osjs/notification', {
		timeout:2000,
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
    dimension: {width: 500, height:280},
    position: {left:220, top:344}
  })
  .on('destroy', () => proc.destroy())
  .render(($content, win) => {
//  	console.log("SETTINGS:\n");
//  	console.log(settings.get('osjs/application/Editor'));  	
    // Add our process and window id to iframe URL
    const suffix = `?pid=${proc.pid}&wid=${win.wid}`;

    // Create an iframe
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.src = proc.resource('/data/editor.html') + suffix;
    iframe.setAttribute('border', '0');

    // Bind window events to iframe
    win.on('blur', () => iframe.contentWindow.blur());
    win.on('focus', () => iframe.contentWindow.focus());
    proc.on('iframe:post', msg => iframe.contentWindow.postMessage(msg, window.location.href));
	win.on('destroy', ()  => {
//		proc.emit('iframe:post', ["saveEditors"]);
//		proc.emit('iframe:post', ["saveSettings"]);
//		alert("Destroying");
	});
    // Listen for messages from iframe

    win.on('iframe:get', msg => {
		
 		switch (msg[0]) {
 			
			case "compile":
				let fileObj= {file: {filename: msg[1].filename, path: msg[1].path}};
			vfs.writefile(msg[1], msg[2])
 
 			.then( () => core.run("Log", fileObj))

			break;
 			case "saveFile":
 
 
 			vfs.writefile(msg[1], msg[2])
  			.then(() => notify("Saved " + msg[1].path))		
       		.catch(error => console.error(error)); // FIXME: Dialog

 				break;
 			case "removeEditor":

 				for (var i= 0; i < files.length; i++) {
 					if (msg[1].path === files[i].path) {
 
						files.splice(i, 1);
						settings.set('osjs/application/Editor', 'files', files);
					}	

 				}
				break;
 			case "readFile":
 				
 //				let file= JSON.parse(msg[1]);
 				proc.emit("iframe:post", ["updateEditor", stashedContents]);
// 				vfs.readfile(file)
// 				.then(contents => console.log(contents))
// 				.catch(error => console.error(error)); // FIXME: Dialog
 				break;
 			case 'clearSettings':
 				settings.clear('osjs/application/Editor');
 				files= [];
 				console.log("Settings cleared");
 				break;
 				
 			case 'clearSession':
 				proc.args.session= "";
 				break;
 			case 'saveSession':
 				proc.args.session = msg[1];
 				break;
 			case "saveSettings":

 //				settings.set('osjs/application/Editor', 'files', msg[1]);
 								settings.set('osjs/application/Editor', 'files', files);
 				console.log("Settings saved");
 				console.log(files);
 //				console.log(settings.get('osjs/application/Editor').files);
 				break;
 
 			case "showSettings":
 				console.log(settings.get('osjs/application/Editor'));
 
 				break;
 			case "restore":
 				if (settings.get('osjs/application/Editor').files) {
 				files= settings.get('osjs/application/Editor').files;

 				for (let i=0; i < files.length; i++) {
// 					proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), "stub"]);
				if (files[i].path !== "restored") {
					console.log(files[i]);
				vfs.readfile(files[i])
				.then(contents => proc.emit('iframe:post', ["createEditorPane", files[i], contents]))
				.catch(error => console.error(i)); // FIXME: Dialog
				}
				else {
//					alert(i);
					files.splice(i, 1);
				}


				}	
			}

 				break;
 		}

// 		proc.send(msg);
    });
 	proc.on('attention', (args) => {
		win.focus();
		if (args.file) {
		let filepath= args.file.path.substring(0, args.file.path.lastIndexOf('/'));
		core.run('Browser', {path: filepath});	

		files.push(args.file);
		settings.set('osjs/application/Editor', 'files', files);
		vfs.readfile(args.file)
			.then(contents => proc.emit('iframe:post', ["createEditorPane", args.file, contents]))
			
			.catch(error => console.error(error)); // FIXME: Dialog
		}	

		
		else {
//		alert("index.js:166");
			proc.emit('iframe:post', args);
		}

	});
 
 
	if (proc.args.file) {

 



		
			files.push(proc.args.file);
		
			settings.set('osjs/application/Editor', 'files', files);
  			iframe.src= iframe.src + "&file=" + JSON.stringify(proc.args.file);
		 
			let filepath= args.file.path.substring(0, args.file.path.lastIndexOf('/'));
			core.run('Browser', {path: filepath});
			vfs.readfile(proc.args.file)
			.then(contents => stashFile(contents))
			.catch(error => console.error(error)); // FIXME: Dialog
			proc.args.file=null;
  		
  
  
  	}
  	else {

				files= settings.get('osjs/application/Editor').files;
				iframe.src= iframe.src + "&restore='true'";
				/*
 				for (let i=0; i < files.length; i++) {
// 					proc.emit('iframe:post', ["createEditorPane", JSON.stringify(settings.get('osjs/application/Editor').files[i]), "stub"]);
				
				vfs.readfile(files[i])
				.then(contents => proc.emit('iframe:post', ["createEditorPane", files[i], contents]))
				.catch(error => console.error(error)); // FIXME: Dialog
				}


				*/



				


  		}
  		
  		
  		
  		
  		
	proc.on('placeCursor',  (...args) => {

		if (args[1])
			win.focus();

			
		var splitArray= args[0].split(":");
			var fileObj= {};
			fileObj.path= "home:" + splitArray[0];
			fileObj.filename=  splitArray[0].replace(/^.*(\\|\/|\:)/, '');
			var cursor= [splitArray[1], splitArray[2]];
			vfs.readfile(fileObj)
			.then(contents => proc.emit('iframe:post', ["createEditorPane", fileObj, contents, cursor]))
			.catch(error => console.error(error)); // FIXME: Dialog
			
//		proc.emit("iframe:post", ['compilationError', args[0]]);
	});


    $content.appendChild(iframe);
    
  });
  
 


  return proc;
};

// Creates the internal callback function when OS.js launches an application
osjs.register(applicationName, register);
