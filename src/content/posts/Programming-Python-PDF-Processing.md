---
title: 学习笔记 | 使用Python对PDF进行处理
pubDate: 2023-07-08 18:00:00.0
updated: 2023-07-08 18:00:00.0
categories: ['学习笔记']
tags: ['Python']
description: ' '
---

## 前言

之前在写一个游戏网站的时候需要提取PDF中的文本和图像数据，对于这种重复性工作，Acrobat显得有点太机械了，于是我决定用万能的工具语言Python尝试一下。因此这篇文章是关于PDF处理的一些方法的整理和优劣分析。

## 具体需求

有如下的一个PDF文件，需要从中提取名称、描述、图片等信息，生成结构化文档。
![CleanShot 2023-07-11 at 03.17.32@2x.png](https://ender-picgo.oss-cn-shenzhen.aliyuncs.com/img/CleanShot%202023-07-11%20at%2003.17.32%402x.png)

## PDF读写库：borb

由于 pdf 的特性，即便是最方便的处理库使用体验依然相对繁琐，和 html 的处理库 `beautifulsoup4` 比起来相距甚远。在PDF领域有一些老牌库比如 `PyPDF2`做一些简单处理也还不错，但目前功能最强大且依然稳定更新的应该还是 [borb | Read, write, and edit PDF files with borb, a pure python library](https://borbpdf.com/index.html).

这个库的优势是有非常完整的文档，但是官网的导览做得有点混乱，并且很多文章代码都存在时效性的问题，这是一个很大的坑。实际上的最新文档和样例是在这个 [GitHub 仓库](https://github.com/jorisschellekens/borb-examples) 里面。

这个库在写 PDF 领域大有可为，不过我这次的需求只是提取文字和图片，以及将之前的文字全都删除，因此主要的操作还是停留在读取这个领域。

### 字体筛选

```python
def text_filter(file_name: str, filter: str) -> dict:
    l0: FontNameFilter = FontNameFilter(filter)

    # filtered text just gets passed to SimpleTextExtraction
    l1: SimpleTextExtraction = SimpleTextExtraction()
    l0.add_listener(l1)

    # read the Document
    doc: typing.Optional[Document] = None
    with open(file_name, "rb") as in_file_handle:
        doc = PDF.loads(in_file_handle, [l0])

    # check whether we have read a Document
    assert doc is not None
    return l1.get_text()
```

`FontNameFilter` 可以过滤 PDF 中对应字体的文本，这在字体繁多的排版设计类 PDF 中大有可为。比如在上面的样例中，我可以通过这个函数过滤出不同类型的文本，例如标题和描述文本。
但是提取文本可能会存在特殊字符，这应该和 PDF 本身的储存方式有关系。比如我上面的文档，提取标题的结果如下，有 `GR`  和 `ZEBR` 这种 不知道怎么出现的字符，以至于整个文本几乎不可用。
```json
{4: 'ORAN GRGE CL EVYZEBR OWNF AISH',
 5: 'PALETT GRE S EVY UZEBR RGEOA NFISH\nTrade',
 6: 'Z GR OO EP VY LANK ZEBR TO AN\nSea Animal Magnet',
 7: 'BLAGR CKE SVY IDE HA ZEBR WA KFISH\nPosturing 1',
 }
```

我尝试的一个解决方式是正则+GPT API，几乎可以解决这个问题，但是对于一个小规模的需求来说有点过于繁琐了。
```python
    def infer_correct_name_from_GPT(input):
        ori = re.sub('\n.*', '', input)
        ori = re.sub('GR|EVY|ZEBR|VY|A ', '', ori)
        ori = remove_extra_spaces_after_second(ori)
        prompt = f"""
        This is an animal name (usually a sea animal) but has some extra characters, such as 'GR' and 'EVY'.\
        Please infer the origin animal name and output only the name (warpped with ''): {ori}"""
        response = get_completion(prompt)
```

## 图片提取

相较于效果并不理想的文字提取，图片提取还算差强人意。但是提取出来的图片有些是镜像翻转的，有些又不是，我也不知道为什么，因此可能还需要使用 `PIL` 库翻转一下图片。
另外需要注意的是，一些 PDF 中会嵌入 svg ，但是嵌入后的 svg 几乎就不可能提取出来了。总而言之，从其它格式导出成 PDF 轻而易举，但是逆向操作非常麻烦，有些操作甚至完全不可行。

```python
import typing

from borb.pdf import Document
from borb.pdf import PDF
from borb.toolkit import ImageExtraction


def extract_images_from_pdf(filename: str, updated_number_dict: dict):
    l: ImageExtraction = ImageExtraction()

    # load
    doc: typing.Optional[Document] = None
    with open(filename, "rb") as in_file_handle:
        doc = PDF.loads(in_file_handle, [l])

    # check whether we have read a Document
    assert doc is not None

    index = 0
    for key, value in l.get_images().items():
        image = value[1]
        image = ImageOps.mirror(image)  # 镜像反转
        card_id = updated_number_dict['card_id'][index]
        filename = f'images/{card_id}.jpg'
        index += 1
        image.save(filename)
```

## PDF转图片：pdf2image

前面说到 `brob` 文字提取效果不好，所以我决定直接简单粗暴地将 PDF 转为图片然后直接OCR。

```python
from pdf2image import convert_from_path
import pytesseract
```

整个操作非常简单，转成图片后先使用 `crop` 裁切需要识别的文字区域，然后调用 `image_to_string` 就行了。运行速度也远优于前面的读写操作。后续也可以裁切一些具有典型 pattern 的区域，做一些图像识别。
```python
# to image
images = convert_from_path(filename)

for index in range(len(images)):
	# get image
	image = images[index]

	# get the card name
	name_box = (50, 390, 449, 432)
	name_region = image.crop(name_box)
	card_name = pytesseract.image_to_string(name_region)
```

## 总结

PDF 批量处理是个大坑，比较可行的操作就是使用各种读写操作库进行图片提取，或者转成图片后进行文字识别。尽量能转成图片就对图片做操作，毕竟对图片进行操作的库就太多了。