css = [
    'about.css',
    'button.css',
    'frame.css',
    'faq.css',
    'index.css',
    'map.css',
    'ramanujan.css',
    'rocket.css',
    'shelf.css',
    'snackbar.css',
    'timeline.css',
    'typewriter.css',
    'mobile.css',
    'info.css'
]

concat = ''
for i in css:
    with open(f'css/{i}') as f:
        concat += f.read()
        concat += '\n\n'

f = open("css/concat.css","w+")
f.write(concat)
f.close()