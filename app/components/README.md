In here reside the Presentational (/dumb) Components

Purpose: How things look (markup, styles)

Aware of Redux: No

To read data: Read data from props

To change data: Invoke callbacks from props


These components describe the *look* but don't know *where* data comes from
or *how* to change it. They only render what's given to them. This way if
we ever migrate away from Redux we'll be able to keep all these components
as they'll have no dependency on Redux.v