# replace those goddamn urls

import os
import os.path

if __name__ == '__main__':
    flist = []

    for dirpath, dirs, files in os.walk("."):
        if dirpath.startswith('./wift-'):
            for fname in files:
                if fname.endswith('.html') or fname.endswith('.js'):
                    flist.append(os.path.join(dirpath, fname))
    
    for fname in flist:
        with open(fname) as f:
            data = f.read()
        count = data.count('wift.local')
        
        if count > 0:
            new_data = data.replace('wift.local', 'wift.io')
            
            with open(fname, 'w') as f:
                f.write(new_data)
            
            print('Replaced {} occurences in {}'.format(count, fname))
