
#### List all xyz spaces 

```
xyzmaps space list
```

This command will list all the xyzspaces for which the user is authorized.

#### Create a new xyz space 

```
xyzmaps space create -t "sample test xyzspace" -d "sample creation"
```

Create a new xyzspace with name x-samplexyzspace. 

##### Options 

-t title

-d description

#### Upload/Update  data to xyz space 
- #### upload geojson
    ```
    xyzmaps space upload x-testxyzspace -f /Users/dhatb/data.geojson
    ```
    Upload data to xyzspace with name x-testxyzspace
    ##### Options 
    -f path to file name
- #### upload csv
    ```
    xyzmaps space upload x-testxyzspace -f /Users/dhatb/data.csv
    ```
    Upload data to xyzspace with name x-testxyzspace
    ##### Options 
    -f path to file name
    -y, --lat [lat]  latitude field name
    -x, --lon [lon]  longitude field name
    -d, --delimiter [,]  delimiter for parsing csv
    -q, --quote ["]  quote used for parsing csv

- #### upload shapefile
    ```
    xyzmaps space upload x-testxyzspace -f /Users/dhatb/data.shp
    ```
    Upload data to xyzspace with name x-testxyzspace
    ##### Options 
    - -f, --file <file>    geojson file to upload
    - -c, --chunk [chunk]  chunk size
    - -t, --tags [tags]    tags for the xyz space
    - -x, --lon [lon]      longitude field name
    - -y, --lat [lat]      latitude field name
    - -z, --alt [alt]      altitude field name
    - -po, --point [point]  points field name
    - -p, --ptag [ptag]    property names to be used to add tag
    - -i, --id [id]        property name(s) to be used as the feature ID
    - -a, --assign         list the sample data and allows you to assign fields which needs to be selected as tags
    
#### View a xyzspace  

```
xyzmaps space show x-testxyzspace
```

List the objects of a xyzspace 

##### Options 

-l limit count

-h offset handle 

#### Delete a xyzspace 

```
xyzmaps space delete x-testxyzspace
```

Delete a xyzspace on which the user is authorised to.

