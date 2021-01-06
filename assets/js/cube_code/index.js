import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh } from 'three'

const container = document.getElementById("cube")

const scene = new Scene();
const camera = new PerspectiveCamera( 75, container.clientWidth / container.clientHeight, 0.1, 1000 );

const renderer = new WebGLRenderer();
renderer.setSize( container.clientWidth, container.clientHeight );
container.appendChild( renderer.domElement );

const geometry = new BoxGeometry(2, 2, 2);
const material = new MeshBasicMaterial( { color: 0x00ffdd } );
const cube = new Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;


function animate() {
    requestAnimationFrame( animate );
    
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    camera.position.z += 0.01;

	renderer.render( scene, camera );
}
animate();
